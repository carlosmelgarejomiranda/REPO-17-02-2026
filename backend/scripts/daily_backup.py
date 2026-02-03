#!/usr/bin/env python3
"""
Daily MongoDB Backup to Cloudinary
===================================
Backs up the MongoDB database daily and uploads to Cloudinary.
Keeps the last 7 backups for recovery purposes.
Sends email alerts on success/failure.

Uses PyMongo for direct export (no mongodump dependency).

Run manually: python scripts/daily_backup.py
Scheduled: Runs automatically every day at 3:00 AM Paraguay time
"""

import os
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
import uuid
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import logging
import resend
from bson import ObjectId, json_util

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
MAX_BACKUPS_TO_KEEP = 7  # Keep last 7 days of backups in Cloudinary

# Collections to skip (ONLY large binary GridFS chunks - files metadata is kept)
SKIP_COLLECTIONS = [
    'images.chunks',           # GridFS binary chunks (large)
    'product_images.chunks',   # GridFS binary chunks (large)
]


def send_backup_alert(success: bool, details: dict):
    """Send email alert about backup status"""
    try:
        timestamp = datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')
        
        if success:
            subject = f"✅ Backup Exitoso - Avenue DB - {timestamp}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">✅ Backup Exitoso</h1>
                    <p style="color: #a8a8a8; margin-top: 10px;">{timestamp}</p>
                </div>
                
                <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #22c55e; border-radius: 8px;">
                    <h3 style="color: #d4a968; margin-top: 0;">Detalles del Backup</h3>
                    <table style="width: 100%; color: #f5ede4;">
                        <tr>
                            <td style="padding: 8px 0; color: #a8a8a8;">Base de datos:</td>
                            <td style="padding: 8px 0;">{details.get('db_name', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a8a8a8;">Tamaño:</td>
                            <td style="padding: 8px 0;">{details.get('size_mb', 'N/A')} MB</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a8a8a8;">Colecciones:</td>
                            <td style="padding: 8px 0;">{details.get('collections_count', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a8a8a8;">Documentos:</td>
                            <td style="padding: 8px 0;">{details.get('total_documents', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a8a8a8;">Ubicación:</td>
                            <td style="padding: 8px 0;">Cloudinary</td>
                        </tr>
                    </table>
                </div>
                
                <p style="color: #666; font-size: 12px; margin-top: 20px; text-align: center;">
                    Este es un mensaje automático del sistema de backups de Avenue.
                </p>
            </div>
            """
        else:
            subject = f"🚨 ALERTA: Backup FALLÓ - Avenue DB - {timestamp}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ef4444; margin: 0;">🚨 BACKUP FALLÓ</h1>
                    <p style="color: #a8a8a8; margin-top: 10px;">{timestamp}</p>
                </div>
                
                <div style="background-color: #1a1a1a; padding: 20px; border: 2px solid #ef4444; border-radius: 8px;">
                    <h3 style="color: #ef4444; margin-top: 0;">⚠️ Acción Requerida</h3>
                    <p style="color: #f5ede4;">El backup automático de la base de datos ha fallado.</p>
                    
                    <h4 style="color: #d4a968; margin-top: 20px;">Error:</h4>
                    <p style="color: #ef4444; background: #ef444420; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all;">
                        {details.get('error', 'Error desconocido')}
                    </p>
                    
                    <h4 style="color: #d4a968; margin-top: 20px;">Pasos a seguir:</h4>
                    <ol style="color: #a8a8a8;">
                        <li>Verificar que MongoDB esté funcionando</li>
                        <li>Revisar los logs del backend</li>
                        <li>Ejecutar backup manual desde el panel admin</li>
                        <li>Si persiste, contactar soporte técnico</li>
                    </ol>
                </div>
                
                <p style="color: #666; font-size: 12px; margin-top: 20px; text-align: center;">
                    Este es un mensaje automático del sistema de backups de Avenue.
                </p>
            </div>
            """
        
        params = {
            "from": "Avenue Sistema <sistema@avenue.com.py>",
            "to": [ADMIN_EMAIL],
            "subject": subject,
            "html": html_content
        }
        
        resend.Emails.send(params)
        logger.info(f"Backup alert email sent to {ADMIN_EMAIL}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send backup alert email: {e}")
        return False


def create_system_notification_sync(success: bool, details: dict):
    """Create a system notification in the database (sync version for script)"""
    try:
        from pymongo import MongoClient
        
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        if success:
            notification = {
                "id": str(uuid.uuid4()),
                "type": "backup_success",
                "title": "✅ Backup Completado",
                "message": f"Backup de {details.get('size_mb', 0)} MB ({details.get('collections_count', 0)} colecciones, {details.get('total_documents', 0)} docs) subido a Cloudinary.",
                "severity": "info",
                "metadata": details,
                "is_read": False,
                "read_by": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        else:
            notification = {
                "id": str(uuid.uuid4()),
                "type": "backup_failed",
                "title": "🚨 Backup Fallido",
                "message": f"Error: {details.get('error', 'Error desconocido')}. Acción requerida.",
                "severity": "critical",
                "metadata": details,
                "is_read": False,
                "read_by": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        
        db.system_notifications.insert_one(notification)
        client.close()
        logger.info(f"System notification created: {notification['title']}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to create system notification: {e}")
        return False


def create_backup():
    """
    Create a MongoDB backup using PyMongo direct export.
    This method doesn't require mongodump to be installed.
    """
    from pymongo import MongoClient
    
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_name = f"mongodb_backup_{DB_NAME}_{timestamp}"
    backup_path = BACKUP_DIR / backup_name
    archive_path = BACKUP_DIR / f"{backup_name}.tar.gz"
    
    # Create backup directory if not exists
    BACKUP_DIR.mkdir(exist_ok=True)
    backup_path.mkdir(exist_ok=True)
    
    logger.info(f"Starting backup of database: {DB_NAME}")
    logger.info(f"Using PyMongo direct export method")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.admin.command('ping')
        logger.info("MongoDB connection successful")
        
        db = client[DB_NAME]
        
        # Get all collection names
        collections = db.list_collection_names()
        logger.info(f"Found {len(collections)} collections")
        
        total_documents = 0
        exported_collections = 0
        
        # Export each collection to JSON (INCLUDING empty ones)
        for coll_name in collections:
            # Skip ONLY large binary chunks
            if coll_name in SKIP_COLLECTIONS:
                logger.info(f"  Skipping {coll_name} (binary chunks)")
                continue
            
            try:
                collection = db[coll_name]
                doc_count = collection.count_documents({})
                
                # Export documents (even if empty - creates empty array)
                documents = list(collection.find({}))
                
                # Write to JSON file using bson json_util for proper serialization
                output_file = backup_path / f"{coll_name}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(documents, f, default=json_util.default, ensure_ascii=False, indent=2)
                
                total_documents += doc_count
                exported_collections += 1
                
                status = "✅" if doc_count > 0 else "⚪"
                logger.info(f"  {status} Exported {coll_name}: {doc_count} documents")
                
            except Exception as e:
                logger.warning(f"  ❌ Failed to export {coll_name}: {e}")
                continue
        
        client.close()
        
        if exported_collections == 0:
            raise Exception("No collections were exported")
        
        logger.info(f"Exported {exported_collections} collections, {total_documents} documents total")
        
        # Generate verification manifest
        manifest = {
            'backup_info': {
                'created_at': datetime.now(timezone.utc).isoformat(),
                'database': DB_NAME,
                'backup_name': backup_name,
                'total_collections': exported_collections,
                'total_documents': total_documents
            },
            'collections': {}
        }
        
        # Read each exported file and add to manifest
        for json_file in backup_path.glob("*.json"):
            coll_name = json_file.stem
            with open(json_file, 'r') as f:
                data = json.load(f)
                manifest['collections'][coll_name] = len(data)
        
        # Write manifest
        manifest_file = backup_path / "_MANIFEST.json"
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Generated verification manifest: _MANIFEST.json")
        
        # Compress the backup
        logger.info("Compressing backup...")
        shutil.make_archive(
            str(backup_path),  # Output filename (without extension)
            'gztar',           # Format
            BACKUP_DIR,        # Root directory
            backup_name        # Directory to archive
        )
        
        logger.info(f"Backup compressed to: {archive_path}")
        
        # Clean up uncompressed directory
        shutil.rmtree(backup_path)
        
        # Get file size
        size_mb = round(archive_path.stat().st_size / (1024 * 1024), 2)
        logger.info(f"Backup size: {size_mb} MB")
        
        return archive_path, {
            'collections_count': exported_collections,
            'total_documents': total_documents,
            'size_mb': size_mb
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
        filename = file_path.stem  # filename without extension
        
        logger.info(f"Uploading backup to Cloudinary...")
        
        result = cloudinary.uploader.upload(
            str(file_path),
            resource_type="raw",  # For non-image files
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
    """Remove backups older than MAX_BACKUPS_TO_KEEP days from Cloudinary"""
    try:
        logger.info(f"Checking for old backups to clean up...")
        
        # List all backups in Cloudinary
        result = cloudinary.api.resources(
            type="upload",
            resource_type="raw",
            prefix="avenue/backups/mongodb_backup_",
            max_results=100
        )
        
        backups = result.get('resources', [])
        
        if len(backups) <= MAX_BACKUPS_TO_KEEP:
            logger.info(f"Only {len(backups)} backups exist, no cleanup needed")
            return
        
        # Sort by created_at and delete oldest ones
        backups_sorted = sorted(backups, key=lambda x: x.get('created_at', ''), reverse=True)
        backups_to_delete = backups_sorted[MAX_BACKUPS_TO_KEEP:]
        
        for backup in backups_to_delete:
            public_id = backup.get('public_id')
            logger.info(f"Deleting old backup: {public_id}")
            cloudinary.uploader.destroy(public_id, resource_type="raw")
        
        logger.info(f"Cleaned up {len(backups_to_delete)} old backups")
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")


def cleanup_local_backups():
    """Remove local backup files after upload"""
    try:
        if BACKUP_DIR.exists():
            for file in BACKUP_DIR.glob("*.tar.gz"):
                file.unlink()
                logger.info(f"Deleted local file: {file.name}")
    except Exception as e:
        logger.error(f"Local cleanup failed: {e}")


def run_backup():
    """Main backup function with email alerts"""
    logger.info("=" * 50)
    logger.info("DAILY BACKUP STARTED")
    logger.info("=" * 50)
    
    backup_details = {
        'db_name': DB_NAME,
        'size_mb': 0,
        'collections_count': 0,
        'total_documents': 0,
        'total_backups': 0,
        'error': None
    }
    
    # Step 1: Create backup using PyMongo
    backup_file, backup_info = create_backup()
    
    if not backup_file:
        error_msg = backup_info.get('error', 'Error desconocido al crear backup')
        logger.error(f"BACKUP FAILED: {error_msg}")
        backup_details['error'] = error_msg
        send_backup_alert(success=False, details=backup_details)
        create_system_notification_sync(success=False, details=backup_details)
        return False
    
    # Update details with backup info
    backup_details.update(backup_info)
    
    # Step 2: Upload to Cloudinary
    upload_result = upload_to_cloudinary(backup_file)
    if not upload_result:
        error_msg = "No se pudo subir el backup a Cloudinary"
        logger.error(f"BACKUP FAILED: {error_msg}")
        backup_details['error'] = error_msg
        send_backup_alert(success=False, details=backup_details)
        create_system_notification_sync(success=False, details=backup_details)
        return False
    
    # Step 3: Cleanup old backups in Cloudinary
    cleanup_old_backups()
    
    # Step 4: Cleanup local files
    cleanup_local_backups()
    
    # Step 5: Count total backups for report
    try:
        result = cloudinary.api.resources(
            type="upload",
            resource_type="raw",
            prefix="avenue/backups/mongodb_backup_",
            max_results=100
        )
        backup_details['total_backups'] = len(result.get('resources', []))
    except:
        backup_details['total_backups'] = '?'
    
    logger.info("=" * 50)
    logger.info("DAILY BACKUP COMPLETED SUCCESSFULLY")
    logger.info("=" * 50)
    
    # Send success alert (email + system notification)
    send_backup_alert(success=True, details=backup_details)
    create_system_notification_sync(success=True, details=backup_details)
    
    return True


if __name__ == "__main__":
    run_backup()
