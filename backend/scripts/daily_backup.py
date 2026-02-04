#!/usr/bin/env python3
"""
Daily MongoDB Backup - Python Method (sin GridFS)
==================================================
Backs up the MongoDB database using Python/PyMongo.
Excludes GridFS collections (images.chunks, images.files) to reduce size.
Uploads to Cloudinary and keeps the last 7 backups.
Sends email alerts on success/failure.

Run manually: python scripts/daily_backup.py
Scheduled: Runs automatically every day at 3:00 AM Paraguay time
"""

import os
import sys
import json
import shutil
import hashlib
import tarfile
from datetime import datetime, timezone
from pathlib import Path
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import logging
import resend
from bson import json_util
from pymongo import MongoClient

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Resend configuration for alerts
resend.api_key = os.environ.get('RESEND_API_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'avenuepy@gmail.com')

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

# Backup configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
BACKUP_DIR = ROOT_DIR / 'backups'
MAX_BACKUPS_TO_KEEP = 7

# Collections to EXCLUDE from backup (GridFS - too large)
EXCLUDED_COLLECTIONS = [
    'images.chunks',
    'images.files',
    'fs.chunks',
    'fs.files',
]


def send_backup_alert(success: bool, details: dict):
    """Send email alert about backup status"""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email alert")
        return
    
    timestamp = datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')
    
    if success:
        subject = f"✅ Backup Exitoso - Avenue DB - {timestamp}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 30px; border-radius: 10px;">
            <h2 style="color: #4ade80; margin-bottom: 20px;">✅ Backup Completado Exitosamente</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Fecha:</td>
                    <td style="padding: 8px 0; color: #fff;">{timestamp}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Base de datos:</td>
                    <td style="padding: 8px 0; color: #fff;">{DB_NAME}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Colecciones:</td>
                    <td style="padding: 8px 0; color: #fff;">{details.get('collections_count', 0)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Documentos:</td>
                    <td style="padding: 8px 0; color: #fff;">{details.get('total_documents', 0):,}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Tamaño:</td>
                    <td style="padding: 8px 0; color: #fff;">{details.get('size_mb', 0)} MB</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Cloudinary URL:</td>
                    <td style="padding: 8px 0; color: #d4a968;">{details.get('cloudinary_url', 'N/A')}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; color: #a8a8a8; font-size: 12px;">
                Nota: Las colecciones de GridFS (imágenes) fueron excluidas para reducir el tamaño.
            </p>
        </div>
        """
    else:
        subject = f"❌ Error en Backup - Avenue DB - {timestamp}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 30px; border-radius: 10px;">
            <h2 style="color: #ef4444; margin-bottom: 20px;">❌ Error en Backup</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Fecha:</td>
                    <td style="padding: 8px 0; color: #fff;">{timestamp}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Base de datos:</td>
                    <td style="padding: 8px 0; color: #fff;">{DB_NAME}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #a8a8a8;">Error:</td>
                    <td style="padding: 8px 0; color: #ef4444;">{details.get('error', 'Error desconocido')}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; color: #fbbf24;">
                ⚠️ Por favor revisá el servidor y los logs para más detalles.
            </p>
        </div>
        """
    
    try:
        resend.Emails.send({
            "from": "Avenue <onboarding@resend.dev>",
            "to": [ADMIN_EMAIL],
            "subject": subject,
            "html": html_content
        })
        logger.info(f"Alert email sent to {ADMIN_EMAIL}")
    except Exception as e:
        logger.error(f"Failed to send alert email: {e}")


def create_system_notification(success: bool, details: dict):
    """Create a system notification in the database"""
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        notification = {
            "id": f"notif_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": "backup_success" if success else "backup_error",
            "title": "✅ Backup Completado" if success else "❌ Error en Backup",
            "message": f"Backup {'exitoso' if success else 'fallido'}: {details.get('collections_count', 0)} colecciones, {details.get('total_documents', 0):,} documentos" if success else f"Error: {details.get('error', 'desconocido')}",
            "severity": "success" if success else "error",
            "read_by": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.system_notifications.insert_one(notification)
        client.close()
        logger.info("System notification created: " + notification["title"])
        
    except Exception as e:
        logger.error(f"Failed to create system notification: {e}")


def create_backup():
    """
    Create a MongoDB backup using Python/PyMongo.
    Excludes GridFS collections to reduce file size.
    """
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_name = f"backup_{DB_NAME}_{timestamp}"
    backup_path = BACKUP_DIR / backup_name
    archive_path = BACKUP_DIR / f"{backup_name}.tar.gz"
    
    # Create backup directory
    BACKUP_DIR.mkdir(exist_ok=True)
    backup_path.mkdir(exist_ok=True)
    
    logger.info("="*70)
    logger.info("🔒 BACKUP DE BASE DE DATOS (sin GridFS)")
    logger.info("="*70)
    logger.info(f"Database: {DB_NAME}")
    logger.info(f"Excluded: {', '.join(EXCLUDED_COLLECTIONS)}")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=30000)
        client.admin.command('ping')
        logger.info("MongoDB connection successful")
        
        db = client[DB_NAME]
        
        # Get all collections except excluded ones
        all_collections = sorted(db.list_collection_names())
        collections = [c for c in all_collections if c not in EXCLUDED_COLLECTIONS]
        
        logger.info(f"Total colecciones: {len(all_collections)}")
        logger.info(f"Colecciones a respaldar: {len(collections)}")
        logger.info(f"Colecciones excluidas: {len(all_collections) - len(collections)}")
        
        # Initialize manifest
        manifest = {
            "backup_info": {
                "type": "PYTHON_BACKUP_NO_GRIDFS",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "database": DB_NAME,
                "backup_name": backup_name,
                "excluded_collections": EXCLUDED_COLLECTIONS,
            },
            "statistics": {
                "total_collections": len(collections),
                "total_documents": 0,
                "total_size_bytes": 0,
            },
            "collections": {},
            "checksums": {},
        }
        
        total_docs = 0
        
        # Export each collection
        for coll_name in collections:
            try:
                collection = db[coll_name]
                
                # Get all documents
                documents = list(collection.find({}))
                doc_count = len(documents)
                total_docs += doc_count
                
                # Serialize to JSON using Extended JSON (preserves BSON types)
                json_data = json.dumps(
                    documents,
                    default=json_util.default,
                    ensure_ascii=False,
                    indent=None  # No indent to reduce size
                )
                
                # Calculate MD5 checksum
                checksum = hashlib.md5(json_data.encode('utf-8')).hexdigest()
                
                # Calculate size
                size_bytes = len(json_data.encode('utf-8'))
                
                # Write to file
                output_file = backup_path / f"{coll_name}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(json_data)
                
                # Update manifest
                manifest["collections"][coll_name] = {
                    "count": doc_count,
                    "size_bytes": size_bytes,
                    "checksum_md5": checksum,
                }
                manifest["checksums"][coll_name] = checksum
                manifest["statistics"]["total_size_bytes"] += size_bytes
                
                # Log progress
                status = "✅" if doc_count > 0 else "⚪"
                logger.info(f"   {status} {coll_name}: {doc_count} docs ({size_bytes/1024:.1f} KB)")
                
            except Exception as e:
                logger.error(f"   ❌ ERROR en {coll_name}: {e}")
                manifest["collections"][coll_name] = {"count": 0, "error": str(e)}
        
        client.close()
        
        # Update manifest statistics
        manifest["statistics"]["total_documents"] = total_docs
        manifest["statistics"]["total_size_kb"] = round(
            manifest["statistics"]["total_size_bytes"] / 1024, 2
        )
        manifest["statistics"]["total_size_mb"] = round(
            manifest["statistics"]["total_size_bytes"] / (1024 * 1024), 2
        )
        
        # Write manifest
        manifest_file = backup_path / "_MANIFEST.json"
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\n📋 Manifest generado: _MANIFEST.json")
        
        # Compress using tarfile
        logger.info(f"\n📦 Comprimiendo backup...")
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(backup_path, arcname=backup_name)
        
        # Clean up uncompressed directory
        shutil.rmtree(backup_path)
        
        # Get file size
        size_mb = round(archive_path.stat().st_size / (1024 * 1024), 2)
        
        logger.info(f"\n{'='*70}")
        logger.info(f"✅ BACKUP COMPLETADO")
        logger.info(f"{'='*70}")
        logger.info(f"   Archivo: {archive_path}")
        logger.info(f"   Tamaño: {size_mb} MB")
        logger.info(f"   Colecciones: {len(collections)}")
        logger.info(f"   Documentos: {total_docs:,}")
        logger.info(f"{'='*70}")
        
        return archive_path, {
            'collections_count': len(collections),
            'total_documents': total_docs,
            'size_mb': size_mb,
            'db_name': DB_NAME,
        }
        
    except Exception as e:
        logger.error(f"Backup creation failed: {e}")
        # Cleanup on failure
        if backup_path.exists():
            shutil.rmtree(backup_path, ignore_errors=True)
        return None, {'error': str(e)}


def upload_to_cloudinary(file_path: Path):
    """Upload backup file to Cloudinary"""
    try:
        filename = file_path.stem
        file_size_mb = file_path.stat().st_size / (1024 * 1024)
        
        logger.info(f"Uploading backup to Cloudinary...")
        logger.info(f"  File: {file_path}")
        logger.info(f"  Size: {file_size_mb:.2f} MB")
        
        # Check file size limit (Cloudinary limit ~100MB for raw files)
        if file_size_mb > 95:
            logger.error(f"File too large for Cloudinary: {file_size_mb:.2f} MB")
            return None
        
        result = cloudinary.uploader.upload(
            str(file_path),
            resource_type="raw",
            folder="avenue/backups",
            public_id=filename,
            overwrite=True
        )
        
        logger.info(f"Backup uploaded successfully!")
        logger.info(f"URL: {result.get('secure_url')}")
        
        return result
        
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return None


def cleanup_old_backups():
    """Clean up old backups from Cloudinary, keeping only the last N"""
    try:
        logger.info(f"Cleaning up old backups (keeping last {MAX_BACKUPS_TO_KEEP})...")
        
        resources = cloudinary.api.resources(
            type="upload",
            resource_type="raw",
            prefix="avenue/backups/",
            max_results=100
        )
        
        backups = resources.get('resources', [])
        
        if len(backups) > MAX_BACKUPS_TO_KEEP:
            # Sort by created_at descending
            backups_sorted = sorted(backups, key=lambda x: x.get('created_at', ''), reverse=True)
            
            # Delete old backups
            to_delete = backups_sorted[MAX_BACKUPS_TO_KEEP:]
            for backup in to_delete:
                public_id = backup.get('public_id')
                if public_id:
                    cloudinary.uploader.destroy(public_id, resource_type="raw")
                    logger.info(f"Deleted old backup: {public_id}")
        
        logger.info("Cleanup completed")
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")


def cleanup_local_backups():
    """Clean up local backup files"""
    try:
        if not BACKUP_DIR.exists():
            return
            
        for file in BACKUP_DIR.glob("*.tar.gz"):
            try:
                file.unlink()
                logger.info(f"Deleted local backup: {file.name}")
            except Exception as e:
                logger.error(f"Failed to delete {file.name}: {e}")
                
    except Exception as e:
        logger.error(f"Local cleanup failed: {e}")


def run_backup():
    """Main backup function that orchestrates the entire backup process"""
    logger.info("\n" + "="*70)
    logger.info("INICIANDO PROCESO DE BACKUP")
    logger.info("="*70 + "\n")
    
    # Step 1: Create backup
    archive_path, backup_details = create_backup()
    
    if not archive_path:
        # Backup creation failed
        send_backup_alert(False, backup_details)
        create_system_notification(False, backup_details)
        return {"success": False, "error": backup_details.get('error', 'Unknown error')}
    
    # Step 2: Upload to Cloudinary
    upload_result = upload_to_cloudinary(archive_path)
    
    if not upload_result:
        error_msg = "Failed to upload to Cloudinary (file may be too large)"
        send_backup_alert(False, {'error': error_msg})
        create_system_notification(False, {'error': error_msg})
        return {"success": False, "error": error_msg}
    
    # Add Cloudinary URL to details
    backup_details['cloudinary_url'] = upload_result.get('secure_url')
    
    # Step 3: Cleanup old backups
    cleanup_old_backups()
    
    # Step 4: Cleanup local backups
    cleanup_local_backups()
    
    # Step 5: Send success notification
    send_backup_alert(True, backup_details)
    create_system_notification(True, backup_details)
    
    logger.info("\n" + "="*70)
    logger.info("✅ PROCESO DE BACKUP COMPLETADO EXITOSAMENTE")
    logger.info("="*70 + "\n")
    
    return {
        "success": True,
        "cloudinary_url": upload_result.get('secure_url'),
        "collections_count": backup_details.get('collections_count'),
        "total_documents": backup_details.get('total_documents'),
        "size_mb": backup_details.get('size_mb')
    }


if __name__ == "__main__":
    run_backup()
