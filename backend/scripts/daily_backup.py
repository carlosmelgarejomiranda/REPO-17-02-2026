#!/usr/bin/env python3
"""
Daily MongoDB Backup to Cloudinary
===================================
Backs up the MongoDB database daily and uploads to Cloudinary.
Keeps the last 7 backups for recovery purposes.
Sends email alerts on success/failure.

Run manually: python scripts/daily_backup.py
Scheduled: Runs automatically every day at 3:00 AM Paraguay time
"""

import os
import subprocess
import shutil
from datetime import datetime, timezone, timedelta
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
                            <td style="padding: 8px 0; color: #a8a8a8;">Ubicación:</td>
                            <td style="padding: 8px 0;">Cloudinary</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #a8a8a8;">Backups almacenados:</td>
                            <td style="padding: 8px 0;">{details.get('total_backups', 'N/A')}</td>
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
                    <p style="color: #ef4444; background: #ef444420; padding: 10px; border-radius: 4px; font-family: monospace;">
                        {details.get('error', 'Error desconocido')}
                    </p>
                    
                    <h4 style="color: #d4a968; margin-top: 20px;">Pasos a seguir:</h4>
                    <ol style="color: #a8a8a8;">
                        <li>Verificar que el servidor esté funcionando</li>
                        <li>Revisar los logs del backend</li>
                        <li>Ejecutar backup manual desde el panel admin</li>
                        <li>Si persiste, contactar soporte técnico</li>
                    </ol>
                </div>
                
                <div style="background-color: #ef444420; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
                    <p style="color: #ef4444; margin: 0; font-weight: bold;">
                        ⏰ Último backup exitoso podría tener hasta 24 horas de antigüedad
                    </p>
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


def create_backup():
    """Create a MongoDB dump and compress it"""
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_name = f"mongodb_backup_{DB_NAME}_{timestamp}"
    backup_path = BACKUP_DIR / backup_name
    archive_path = BACKUP_DIR / f"{backup_name}.tar.gz"
    
    # Create backup directory if not exists
    BACKUP_DIR.mkdir(exist_ok=True)
    
    logger.info(f"Starting backup of database: {DB_NAME}")
    
    try:
        # Run mongodump
        cmd = [
            'mongodump',
            '--uri', MONGO_URL,
            '--db', DB_NAME,
            '--out', str(backup_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"mongodump failed: {result.stderr}")
            return None
        
        logger.info(f"Database dumped to: {backup_path}")
        
        # Compress the backup
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
        size_mb = archive_path.stat().st_size / (1024 * 1024)
        logger.info(f"Backup size: {size_mb:.2f} MB")
        
        return archive_path
        
    except Exception as e:
        logger.error(f"Backup creation failed: {e}")
        return None


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
        'total_backups': 0,
        'error': None
    }
    
    # Step 1: Create backup
    backup_file = create_backup()
    if not backup_file:
        error_msg = "No se pudo crear el dump de MongoDB"
        logger.error(f"BACKUP FAILED: {error_msg}")
        backup_details['error'] = error_msg
        send_backup_alert(success=False, details=backup_details)
        return False
    
    # Get file size
    backup_details['size_mb'] = round(backup_file.stat().st_size / (1024 * 1024), 2)
    
    # Step 2: Upload to Cloudinary
    upload_result = upload_to_cloudinary(backup_file)
    if not upload_result:
        error_msg = "No se pudo subir el backup a Cloudinary"
        logger.error(f"BACKUP FAILED: {error_msg}")
        backup_details['error'] = error_msg
        send_backup_alert(success=False, details=backup_details)
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
    
    # Send success alert
    send_backup_alert(success=True, details=backup_details)
    
    return True


if __name__ == "__main__":
    run_backup()
