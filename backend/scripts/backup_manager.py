#!/usr/bin/env python3
"""
BACKUP MANAGER - Complete Backup Solution
==========================================
Includes:
1. Full backup of ALL collections (no exceptions)
2. Verification that backup is complete
3. Integrity check comparing backup vs live DB
"""

import os
import json
import shutil
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from bson import json_util, ObjectId
from pymongo import MongoClient
import logging
import tarfile

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class BackupManager:
    """Complete backup management with verification"""
    
    def __init__(self, mongo_url: str = None, db_name: str = None):
        self.mongo_url = mongo_url or os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        self.db_name = db_name or os.environ.get('DB_NAME', 'test_database')
        self.client = None
        self.db = None
    
    def connect(self):
        """Connect to MongoDB"""
        self.client = MongoClient(self.mongo_url, serverSelectionTimeoutMS=5000)
        self.client.admin.command('ping')
        self.db = self.client[self.db_name]
        logger.info(f"Connected to MongoDB: {self.db_name}")
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
    
    def get_all_collections(self) -> list:
        """Get list of ALL collections in database"""
        return sorted(self.db.list_collection_names())
    
    def get_collection_stats(self) -> dict:
        """Get document count for each collection"""
        stats = {}
        for coll_name in self.get_all_collections():
            stats[coll_name] = self.db[coll_name].count_documents({})
        return stats
    
    def create_full_backup(self, output_dir: str = "/tmp") -> dict:
        """
        Create a COMPLETE backup of ALL collections
        Returns dict with backup info and verification data
        """
        self.connect()
        
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        backup_name = f"mongodb_backup_{self.db_name}_{timestamp}"
        backup_path = Path(output_dir) / backup_name
        backup_path.mkdir(exist_ok=True)
        
        logger.info("=" * 70)
        logger.info("🔒 CREATING FULL BACKUP - ALL COLLECTIONS")
        logger.info("=" * 70)
        
        collections = self.get_all_collections()
        logger.info(f"Total collections to backup: {len(collections)}")
        
        # Manifest with verification data
        manifest = {
            'backup_info': {
                'created_at': datetime.now(timezone.utc).isoformat(),
                'database': self.db_name,
                'backup_name': backup_name,
                'total_collections': len(collections),
                'total_documents': 0
            },
            'collections': {},
            'verification': {
                'checksums': {},
                'record_counts': {}
            }
        }
        
        total_docs = 0
        
        for coll_name in collections:
            try:
                collection = self.db[coll_name]
                
                # Get all documents
                documents = list(collection.find({}))
                doc_count = len(documents)
                total_docs += doc_count
                
                # Serialize to JSON
                json_data = json.dumps(documents, default=json_util.default, ensure_ascii=False, indent=2)
                
                # Calculate checksum for verification
                checksum = hashlib.md5(json_data.encode('utf-8')).hexdigest()
                
                # Write to file
                output_file = backup_path / f"{coll_name}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(json_data)
                
                # Update manifest
                manifest['collections'][coll_name] = {
                    'count': doc_count,
                    'file': f"{coll_name}.json",
                    'checksum': checksum,
                    'status': 'OK'
                }
                manifest['verification']['checksums'][coll_name] = checksum
                manifest['verification']['record_counts'][coll_name] = doc_count
                
                status_icon = "✅" if doc_count > 0 else "⚪"
                logger.info(f"  {status_icon} {coll_name}: {doc_count} documentos")
                
            except Exception as e:
                manifest['collections'][coll_name] = {
                    'count': 0,
                    'file': None,
                    'checksum': None,
                    'status': f'ERROR: {str(e)}'
                }
                logger.error(f"  ❌ {coll_name}: {e}")
        
        manifest['backup_info']['total_documents'] = total_docs
        
        # Write manifest
        manifest_file = backup_path / "_MANIFEST.json"
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        # Compress
        archive_path = Path(output_dir) / f"{backup_name}.tar.gz"
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(backup_path, arcname=backup_name)
        
        # Get archive size
        archive_size = archive_path.stat().st_size
        
        # Cleanup uncompressed folder
        shutil.rmtree(backup_path)
        
        self.disconnect()
        
        result = {
            'success': True,
            'archive_path': str(archive_path),
            'archive_size_bytes': archive_size,
            'archive_size_mb': round(archive_size / (1024 * 1024), 2),
            'total_collections': len(collections),
            'total_documents': total_docs,
            'manifest': manifest
        }
        
        logger.info("=" * 70)
        logger.info(f"✅ BACKUP COMPLETADO")
        logger.info(f"   Archivo: {archive_path}")
        logger.info(f"   Tamaño: {result['archive_size_mb']} MB")
        logger.info(f"   Colecciones: {len(collections)}")
        logger.info(f"   Documentos: {total_docs}")
        logger.info("=" * 70)
        
        return result
    
    def verify_backup(self, backup_path: str) -> dict:
        """
        Verify backup integrity against live database
        Returns detailed verification report
        """
        self.connect()
        
        logger.info("=" * 70)
        logger.info("🔍 VERIFICANDO INTEGRIDAD DEL BACKUP")
        logger.info("=" * 70)
        
        # Extract if compressed
        extract_dir = Path("/tmp/backup_verify_temp")
        if extract_dir.exists():
            shutil.rmtree(extract_dir)
        extract_dir.mkdir()
        
        if backup_path.endswith('.tar.gz'):
            with tarfile.open(backup_path, 'r:gz') as tar:
                tar.extractall(extract_dir)
            # Find the actual backup folder
            subdirs = list(extract_dir.iterdir())
            if subdirs:
                backup_folder = subdirs[0]
            else:
                return {'success': False, 'error': 'Empty archive'}
        else:
            backup_folder = Path(backup_path)
        
        # Load manifest
        manifest_path = backup_folder / "_MANIFEST.json"
        if manifest_path.exists():
            with open(manifest_path) as f:
                manifest = json.load(f)
        else:
            manifest = None
        
        # Get current DB state
        current_collections = set(self.get_all_collections())
        current_stats = self.get_collection_stats()
        
        # Get backup state
        backup_files = {f.stem: f for f in backup_folder.glob("*.json") if f.stem != "_MANIFEST"}
        backup_collections = set(backup_files.keys())
        
        report = {
            'success': True,
            'verified_at': datetime.now(timezone.utc).isoformat(),
            'backup_path': backup_path,
            'summary': {
                'collections_in_db': len(current_collections),
                'collections_in_backup': len(backup_collections),
                'missing_in_backup': [],
                'extra_in_backup': [],
                'record_mismatches': []
            },
            'collections': {},
            'issues': []
        }
        
        # Check for missing collections
        missing = current_collections - backup_collections
        extra = backup_collections - current_collections
        
        report['summary']['missing_in_backup'] = sorted(list(missing))
        report['summary']['extra_in_backup'] = sorted(list(extra))
        
        if missing:
            report['success'] = False
            for coll in missing:
                report['issues'].append({
                    'type': 'MISSING_COLLECTION',
                    'collection': coll,
                    'records_in_db': current_stats.get(coll, 0),
                    'severity': 'HIGH' if current_stats.get(coll, 0) > 0 else 'LOW'
                })
        
        # Verify each collection
        for coll_name in current_collections:
            db_count = current_stats.get(coll_name, 0)
            
            if coll_name in backup_files:
                # Load backup data
                with open(backup_files[coll_name]) as f:
                    backup_data = json.load(f)
                backup_count = len(backup_data)
                
                # Calculate checksum of backup file
                with open(backup_files[coll_name], 'rb') as f:
                    backup_checksum = hashlib.md5(f.read()).hexdigest()
                
                # Compare counts
                if db_count != backup_count:
                    diff = db_count - backup_count
                    report['summary']['record_mismatches'].append({
                        'collection': coll_name,
                        'db_count': db_count,
                        'backup_count': backup_count,
                        'difference': diff
                    })
                    if abs(diff) > 0:
                        report['issues'].append({
                            'type': 'RECORD_MISMATCH',
                            'collection': coll_name,
                            'db_count': db_count,
                            'backup_count': backup_count,
                            'difference': diff,
                            'severity': 'MEDIUM' if diff > 0 else 'INFO'
                        })
                
                status = '✅' if db_count == backup_count else '⚠️'
                report['collections'][coll_name] = {
                    'status': 'OK' if db_count == backup_count else 'MISMATCH',
                    'db_count': db_count,
                    'backup_count': backup_count,
                    'checksum': backup_checksum
                }
            else:
                status = '❌'
                report['collections'][coll_name] = {
                    'status': 'MISSING',
                    'db_count': db_count,
                    'backup_count': 0
                }
            
            logger.info(f"  {status} {coll_name}: DB={db_count}, Backup={report['collections'][coll_name].get('backup_count', 0)}")
        
        # Cleanup
        shutil.rmtree(extract_dir)
        self.disconnect()
        
        # Final summary
        logger.info("=" * 70)
        if report['success'] and not report['issues']:
            logger.info("✅ VERIFICACIÓN EXITOSA - Backup completo e íntegro")
        else:
            logger.info("⚠️ VERIFICACIÓN CON PROBLEMAS")
            for issue in report['issues']:
                logger.warning(f"   - {issue['type']}: {issue['collection']} ({issue['severity']})")
        logger.info("=" * 70)
        
        return report
    
    def quick_verify(self) -> dict:
        """
        Quick verification of current DB state
        Returns collection counts for comparison
        """
        self.connect()
        stats = self.get_collection_stats()
        total = sum(stats.values())
        self.disconnect()
        
        return {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'database': self.db_name,
            'total_collections': len(stats),
            'total_documents': total,
            'collections': stats
        }


def create_backup_with_verification():
    """Convenience function to create backup and verify it"""
    manager = BackupManager()
    
    # Create backup
    backup_result = manager.create_full_backup()
    
    if backup_result['success']:
        # Verify backup
        verify_result = manager.verify_backup(backup_result['archive_path'])
        
        return {
            'backup': backup_result,
            'verification': verify_result
        }
    
    return {'backup': backup_result, 'verification': None}


if __name__ == "__main__":
    result = create_backup_with_verification()
    print(json.dumps(result, indent=2, default=str))
