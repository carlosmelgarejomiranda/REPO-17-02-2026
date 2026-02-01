#!/usr/bin/env python3
"""
FULL MongoDB Backup - No skipping
=================================
Creates a COMPLETE backup of ALL collections, including empty ones.
Use this for migration/audit purposes.
"""

import os
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from bson import json_util
from pymongo import MongoClient
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_full_backup():
    """Create a complete backup of ALL collections - no skipping"""
    
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME = os.environ.get('DB_NAME', 'test_database')
    
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_name = f"FULL_backup_{DB_NAME}_{timestamp}"
    backup_path = Path(f"/tmp/{backup_name}")
    
    backup_path.mkdir(exist_ok=True)
    
    logger.info("=" * 60)
    logger.info("FULL BACKUP - ALL COLLECTIONS (NO SKIPPING)")
    logger.info("=" * 60)
    
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {MONGO_URL}")
        
        db = client[DB_NAME]
        collections = db.list_collection_names()
        
        logger.info(f"\nTotal collections found: {len(collections)}")
        
        # Create manifest
        manifest = {
            'created_at': datetime.now(timezone.utc).isoformat(),
            'database': DB_NAME,
            'total_collections': len(collections),
            'collections': {}
        }
        
        for coll_name in sorted(collections):
            try:
                collection = db[coll_name]
                doc_count = collection.count_documents({})
                documents = list(collection.find({}))
                
                # Write to JSON file
                output_file = backup_path / f"{coll_name}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(documents, f, default=json_util.default, ensure_ascii=False, indent=2)
                
                manifest['collections'][coll_name] = {
                    'count': doc_count,
                    'exported': len(documents),
                    'status': 'OK'
                }
                
                status = "✓" if doc_count > 0 else "○ (empty)"
                logger.info(f"  {status} {coll_name}: {doc_count} documents")
                
            except Exception as e:
                manifest['collections'][coll_name] = {
                    'count': 0,
                    'exported': 0,
                    'status': f'ERROR: {str(e)}'
                }
                logger.error(f"  ✗ {coll_name}: {e}")
        
        # Write manifest
        manifest_file = backup_path / "_MANIFEST.json"
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
        
        client.close()
        
        # Compress
        archive_path = f"/tmp/{backup_name}.tar.gz"
        shutil.make_archive(f"/tmp/{backup_name}", 'gztar', '/tmp', backup_name)
        
        # Cleanup uncompressed
        shutil.rmtree(backup_path)
        
        logger.info(f"\n{'=' * 60}")
        logger.info(f"✅ FULL BACKUP COMPLETED")
        logger.info(f"   File: {archive_path}")
        logger.info(f"   Collections: {len(collections)}")
        logger.info(f"{'=' * 60}")
        
        return archive_path
        
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        return None


if __name__ == "__main__":
    create_full_backup()
