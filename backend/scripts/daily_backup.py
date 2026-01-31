#!/usr/bin/env python3
"""
Daily MongoDB Backup to Cloudinary
===================================
Backs up the MongoDB database daily and uploads to Cloudinary.
Keeps the last 7 backups for recovery purposes.

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
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

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
    """Main backup function"""
    logger.info("=" * 50)
    logger.info("DAILY BACKUP STARTED")
    logger.info("=" * 50)
    
    # Step 1: Create backup
    backup_file = create_backup()
    if not backup_file:
        logger.error("BACKUP FAILED: Could not create backup")
        return False
    
    # Step 2: Upload to Cloudinary
    upload_result = upload_to_cloudinary(backup_file)
    if not upload_result:
        logger.error("BACKUP FAILED: Could not upload to Cloudinary")
        return False
    
    # Step 3: Cleanup old backups in Cloudinary
    cleanup_old_backups()
    
    # Step 4: Cleanup local files
    cleanup_local_backups()
    
    logger.info("=" * 50)
    logger.info("DAILY BACKUP COMPLETED SUCCESSFULLY")
    logger.info("=" * 50)
    
    return True


if __name__ == "__main__":
    run_backup()
