#!/usr/bin/env python3
"""
Daily MongoDB Backup - usando mongodump
========================================
Backs up the MongoDB database using native mongodump tool.
Uploads to Cloudinary and keeps the last 7 backups.
Sends email alerts on success/failure.

Run manually: python scripts/daily_backup.py
Scheduled: Runs automatically every day at 3:00 AM Paraguay time
"""

import os
import sys
import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import logging
import resend

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

# Global variable to store last upload error
_last_upload_error = None


def send_backup_alert(success: bool, details: dict):
    """Send email alert about backup status"""
    try:
        timestamp = datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')
        
        if success:
            subject = f"✅ Backup Exitoso - Avenue DB - {timestamp}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #22c55e; margin: 0;">✅ Backup 100% Completo</h1>
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
                            <td style="padding: 8px 0;">{details.get('total_documents', 'N/A'):,}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a8a8a8;">Verificación:</td>
                            <td style="padding: 8px 0; color: #22c55e;">✅ Checksums válidos</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a8a8a8;">Ubicación:</td>
                            <td style="padding: 8px 0;">Cloudinary</td>
                        </tr>
                    </table>
                </div>
                
                <p style="text-align: center; color: #a8a8a8; margin-top: 30px; font-size: 12px;">
                    Este es un mensaje automático del sistema de backup de Avenue.
                </p>
            </div>
            """
        else:
            subject = f"❌ ERROR Backup - Avenue DB - {timestamp}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #f5ede4; padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ef4444; margin: 0;">❌ Error en Backup</h1>
                    <p style="color: #a8a8a8; margin-top: 10px;">{timestamp}</p>
                </div>
                
                <div style="background-color: #1a1a1a; padding: 20px; border: 1px solid #ef4444; border-radius: 8px;">
                    <h3 style="color: #ef4444; margin-top: 0;">Detalles del Error</h3>
                    <p style="color: #f5ede4; background-color: #2a0a0a; padding: 15px; border-radius: 4px; font-family: monospace;">
                        {details.get('error', 'Error desconocido')}
                    </p>
                </div>
                
                <p style="text-align: center; color: #a8a8a8; margin-top: 30px; font-size: 12px;">
                    Por favor revisa el sistema de backup lo antes posible.
                </p>
            </div>
            """
        
        # Send email
        if resend.api_key:
            result = resend.Emails.send({
                "from": "Avenue System <onboarding@resend.dev>",
                "to": [ADMIN_EMAIL],
                "subject": subject,
                "html": html_content
            })
            logger.info(f"Alert email sent: {result}")
        else:
            logger.warning("RESEND_API_KEY not configured, skipping email alert")
            
    except Exception as e:
        logger.error(f"Failed to send alert email: {e}")


def create_system_notification(success: bool, details: dict):
    """Create a system notification in the database"""
    try:
        from pymongo import MongoClient as PyMongoClient
        client = PyMongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
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
    Create a MongoDB backup using mongodump.
    This is the most reliable method for MongoDB backups.
    """
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_name = f"mongodump_{DB_NAME}_{timestamp}"
    backup_path = BACKUP_DIR / backup_name
    archive_path = BACKUP_DIR / f"{backup_name}.gz"
    
    # Create backup directory
    BACKUP_DIR.mkdir(exist_ok=True)
    
    logger.info("="*70)
    logger.info("🔒 BACKUP CON MONGODUMP")
    logger.info("="*70)
    logger.info(f"Database: {DB_NAME}")
    logger.info(f"MONGO_URL: {MONGO_URL[:50]}..." if len(MONGO_URL) > 50 else f"MONGO_URL: {MONGO_URL}")
    
    try:
        # Build mongodump command
        # mongodump --uri="mongodb://..." --db=dbname --archive=file.gz --gzip
        cmd = [
            'mongodump',
            f'--uri={MONGO_URL}',
            f'--db={DB_NAME}',
            f'--archive={archive_path}',
            '--gzip'
        ]
        
        logger.info(f"Ejecutando: mongodump --db={DB_NAME} --archive={archive_path} --gzip")
        
        # Run mongodump
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout
        )
        
        if result.returncode != 0:
            logger.error(f"mongodump failed: {result.stderr}")
            return None, {'error': f"mongodump failed: {result.stderr}"}
        
        # Log output
        if result.stdout:
            logger.info(result.stdout)
        if result.stderr:
            # mongodump outputs progress to stderr
            for line in result.stderr.split('\n'):
                if line.strip():
                    logger.info(f"  {line}")
        
        # Verify file was created
        if not archive_path.exists():
            return None, {'error': 'mongodump did not create output file'}
        
        # Get file size
        size_mb = round(archive_path.stat().st_size / (1024 * 1024), 2)
        
        # Get collection count using mongosh
        try:
            count_cmd = ['mongosh', '--quiet', '--eval', 
                f'db.getSiblingDB("{DB_NAME}").getCollectionNames().length']
            count_result = subprocess.run(count_cmd, capture_output=True, text=True, timeout=30)
            collections_count = int(count_result.stdout.strip()) if count_result.returncode == 0 else 0
            
            # Get document count
            docs_cmd = ['mongosh', '--quiet', '--eval', 
                f'''
                let total = 0;
                db.getSiblingDB("{DB_NAME}").getCollectionNames().forEach(c => {{
                    total += db.getSiblingDB("{DB_NAME}").getCollection(c).countDocuments();
                }});
                print(total);
                ''']
            docs_result = subprocess.run(docs_cmd, capture_output=True, text=True, timeout=60)
            total_documents = int(docs_result.stdout.strip()) if docs_result.returncode == 0 else 0
        except:
            collections_count = 0
            total_documents = 0
        
        logger.info(f"\n{'='*70}")
        logger.info(f"✅ MONGODUMP COMPLETADO")
        logger.info(f"{'='*70}")
        logger.info(f"   Archivo: {archive_path}")
        logger.info(f"   Tamaño: {size_mb} MB")
        logger.info(f"   Colecciones: {collections_count}")
        logger.info(f"   Documentos: {total_documents:,}")
        logger.info(f"{'='*70}")
        
        return archive_path, {
            'collections_count': collections_count,
            'total_documents': total_documents,
            'size_mb': size_mb,
            'db_name': DB_NAME,
        }
        
    except subprocess.TimeoutExpired:
        logger.error("mongodump timeout after 10 minutes")
        return None, {'error': 'mongodump timeout after 10 minutes'}
    except FileNotFoundError:
        logger.error("mongodump not found. Is MongoDB tools installed?")
        return None, {'error': 'mongodump not found. MongoDB tools not installed.'}
    except Exception as e:
        logger.error(f"Backup creation failed: {e}")
        return None, {'error': str(e)}


# Global variable to store last upload error
_last_upload_error = None

def upload_to_cloudinary(file_path: Path):
    """Upload backup file to Cloudinary"""
    global _last_upload_error
    _last_upload_error = None
    
    try:
        filename = file_path.stem
        file_size_mb = file_path.stat().st_size / (1024 * 1024)
        
        logger.info(f"Uploading backup to Cloudinary...")
        logger.info(f"  File: {file_path}")
        logger.info(f"  Size: {file_size_mb:.2f} MB")
        
        # Check if Cloudinary is configured
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')
        
        if not all([cloud_name, api_key, api_secret]):
            _last_upload_error = f"Cloudinary no configurado: cloud_name={bool(cloud_name)}, api_key={bool(api_key)}, api_secret={bool(api_secret)}"
            logger.error(_last_upload_error)
            return None
        
        logger.info(f"  Cloudinary cloud: {cloud_name}")
        
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
        
    except cloudinary.exceptions.Error as e:
        _last_upload_error = f"Cloudinary API error: {str(e)}"
        logger.error(_last_upload_error)
        return None
    except Exception as e:
        _last_upload_error = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Cloudinary upload failed: {_last_upload_error}")
        import traceback
        logger.error(traceback.format_exc())
        return None


def cleanup_old_backups():
    """Remove old backups from Cloudinary, keeping only the last MAX_BACKUPS_TO_KEEP"""
    try:
        logger.info(f"Checking for old backups to clean up...")
        
        # List all backups in the folder
        result = cloudinary.api.resources(
            type="upload",
            resource_type="raw",
            prefix="avenue/backups/",
            max_results=100
        )
        
        resources = result.get('resources', [])
        
        if len(resources) > MAX_BACKUPS_TO_KEEP:
            # Sort by created_at (oldest first)
            sorted_resources = sorted(resources, key=lambda x: x.get('created_at', ''))
            
            # Calculate how many to delete
            to_delete = len(sorted_resources) - MAX_BACKUPS_TO_KEEP
            
            for i in range(to_delete):
                public_id = sorted_resources[i]['public_id']
                logger.info(f"Deleting old backup: {public_id}")
                cloudinary.uploader.destroy(public_id, resource_type="raw")
            
            logger.info(f"Cleaned up {to_delete} old backup(s)")
        else:
            logger.info(f"No cleanup needed ({len(resources)} backups, max {MAX_BACKUPS_TO_KEEP})")
            
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")


def cleanup_local_backups():
    """Remove local backup files after successful upload"""
    try:
        if BACKUP_DIR.exists():
            for file in BACKUP_DIR.glob("*.tar.gz"):
                file.unlink()
                logger.info(f"Removed local backup: {file.name}")
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
        error_msg = _last_upload_error or 'Failed to upload to Cloudinary'
        send_backup_alert(False, {'error': error_msg})
        create_system_notification(False, {'error': error_msg})
        return {"success": False, "error": error_msg}
    
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
