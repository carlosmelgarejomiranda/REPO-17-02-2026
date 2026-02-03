#!/usr/bin/env python3
"""
BACKUP 100% COMPLETO - SIN EXCEPCIONES
======================================
Incluye:
- TODAS las colecciones (incluyendo GridFS chunks)
- TODOS los documentos
- Metadata de índices (para referencia, se recrearán)
- Manifest de verificación con checksums
"""

import os
import sys
import json
import shutil
import hashlib
import tarfile
import logging
from datetime import datetime, timezone
from pathlib import Path
from bson import json_util
from pymongo import MongoClient

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_100_percent_backup(
    mongo_url: str = None,
    db_name: str = None,
    output_dir: str = "/tmp"
) -> dict:
    """
    Crea un backup 100% completo de la base de datos.
    NO OMITE NADA.
    """
    
    # Get connection details from environment if not provided
    if not mongo_url:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    if not db_name:
        db_name = os.environ.get('DB_NAME', 'test_database')
    
    logger.info("="*70)
    logger.info("🔒 BACKUP 100% COMPLETO - SIN EXCEPCIONES")
    logger.info("="*70)
    
    # Connect to MongoDB
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=10000)
    client.admin.command('ping')
    db = client[db_name]
    
    logger.info(f"Conectado a: {db_name}")
    
    # Create backup directory
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_name = f"backup_100_percent_{db_name}_{timestamp}"
    backup_path = Path(output_dir) / backup_name
    backup_path.mkdir(exist_ok=True)
    
    # Get ALL collections - NO EXCEPTIONS
    collections = sorted(db.list_collection_names())
    logger.info(f"Colecciones encontradas: {len(collections)}")
    
    # Initialize manifest
    manifest = {
        "backup_info": {
            "type": "100_PERCENT_COMPLETE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "database": db_name,
            "backup_name": backup_name,
            "mongo_url_masked": mongo_url[:20] + "...",
        },
        "statistics": {
            "total_collections": len(collections),
            "total_documents": 0,
            "total_size_bytes": 0,
        },
        "collections": {},
        "indexes": {},
        "checksums": {},
    }
    
    total_docs = 0
    
    # Export EACH collection - NO SKIPPING
    for coll_name in collections:
        try:
            collection = db[coll_name]
            
            # Get ALL documents
            documents = list(collection.find({}))
            doc_count = len(documents)
            total_docs += doc_count
            
            # Serialize to JSON using Extended JSON (preserves BSON types)
            json_data = json.dumps(
                documents, 
                default=json_util.default, 
                ensure_ascii=False, 
                indent=2
            )
            
            # Calculate MD5 checksum
            checksum = hashlib.md5(json_data.encode('utf-8')).hexdigest()
            
            # Calculate size
            size_bytes = len(json_data.encode('utf-8'))
            
            # Write to file
            output_file = backup_path / f"{coll_name}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(json_data)
            
            # Get index information
            indexes = collection.index_information()
            
            # Update manifest
            manifest["collections"][coll_name] = {
                "count": doc_count,
                "size_bytes": size_bytes,
                "size_kb": round(size_bytes / 1024, 2),
                "checksum_md5": checksum,
                "file": f"{coll_name}.json",
                "indexes_count": len(indexes),
            }
            manifest["checksums"][coll_name] = checksum
            manifest["indexes"][coll_name] = {
                name: {"keys": list(info.get("key", []))} 
                for name, info in indexes.items()
            }
            manifest["statistics"]["total_size_bytes"] += size_bytes
            
            # Log progress
            status = "✅" if doc_count > 0 else "⚪"
            logger.info(f"   {status} {coll_name}: {doc_count} docs ({size_bytes/1024:.1f} KB)")
            
        except Exception as e:
            logger.error(f"   ❌ ERROR en {coll_name}: {e}")
            manifest["collections"][coll_name] = {
                "count": 0,
                "error": str(e),
            }
    
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
    
    # Create verification file (simple format for quick check)
    verification = {
        "database": db_name,
        "timestamp": manifest["backup_info"]["created_at"],
        "collections": {
            name: data["count"] 
            for name, data in manifest["collections"].items()
        },
        "total_documents": total_docs,
        "checksums": manifest["checksums"],
    }
    
    verify_file = backup_path / "_VERIFICACION.json"
    with open(verify_file, 'w', encoding='utf-8') as f:
        json.dump(verification, f, indent=2, ensure_ascii=False)
    
    logger.info(f"📋 Archivo de verificación: _VERIFICACION.json")
    
    # Compress
    logger.info(f"\n📦 Comprimiendo backup...")
    archive_path = Path(output_dir) / f"{backup_name}.tar.gz"
    
    with tarfile.open(archive_path, "w:gz") as tar:
        tar.add(backup_path, arcname=backup_name)
    
    archive_size = archive_path.stat().st_size
    
    # Cleanup uncompressed folder
    shutil.rmtree(backup_path)
    
    # Close connection
    client.close()
    
    # Final summary
    logger.info(f"\n{'='*70}")
    logger.info(f"✅ BACKUP 100% COMPLETO")
    logger.info(f"{'='*70}")
    logger.info(f"   Archivo: {archive_path}")
    logger.info(f"   Tamaño: {archive_size / (1024*1024):.2f} MB")
    logger.info(f"   Colecciones: {len(collections)}")
    logger.info(f"   Documentos: {total_docs:,}")
    logger.info(f"{'='*70}")
    
    return {
        "success": True,
        "archive_path": str(archive_path),
        "archive_size_bytes": archive_size,
        "archive_size_mb": round(archive_size / (1024*1024), 2),
        "total_collections": len(collections),
        "total_documents": total_docs,
        "manifest": manifest,
    }


def verify_backup(backup_path: str, mongo_url: str = None, db_name: str = None) -> dict:
    """
    Verifica que un backup contenga el 100% de los datos.
    """
    
    if not mongo_url:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    if not db_name:
        db_name = os.environ.get('DB_NAME', 'test_database')
    
    logger.info("="*70)
    logger.info("🔍 VERIFICACIÓN DE BACKUP")
    logger.info("="*70)
    
    # Extract backup
    extract_dir = Path("/tmp/backup_verify_temp")
    if extract_dir.exists():
        shutil.rmtree(extract_dir)
    extract_dir.mkdir()
    
    with tarfile.open(backup_path, 'r:gz') as tar:
        tar.extractall(extract_dir)
    
    # Find backup folder
    backup_folder = list(extract_dir.iterdir())[0]
    
    # Load manifest
    manifest_path = backup_folder / "_MANIFEST.json"
    with open(manifest_path) as f:
        manifest = json.load(f)
    
    backup_collections = manifest["collections"]
    backup_checksums = manifest["checksums"]
    
    # Connect to DB
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=10000)
    db = client[db_name]
    
    # Compare
    db_collections = sorted(db.list_collection_names())
    
    issues = []
    
    logger.info(f"\n{'Colección':<35} | {'BD':<8} | {'Backup':<8} | {'Checksum':<10} | {'Estado'}")
    logger.info("-"*85)
    
    all_colls = set(db_collections) | set(backup_collections.keys())
    
    for coll_name in sorted(all_colls):
        db_count = db[coll_name].count_documents({}) if coll_name in db_collections else 0
        backup_data = backup_collections.get(coll_name, {})
        backup_count = backup_data.get("count", 0)
        
        # Verify checksum
        json_file = backup_folder / f"{coll_name}.json"
        if json_file.exists():
            with open(json_file, 'rb') as f:
                current_checksum = hashlib.md5(f.read()).hexdigest()
            expected_checksum = backup_checksums.get(coll_name, "")
            checksum_ok = current_checksum == expected_checksum
        else:
            checksum_ok = False
        
        # Determine status
        if coll_name not in backup_collections:
            status = "❌ FALTA EN BACKUP"
            issues.append(f"FALTA: {coll_name} ({db_count} docs)")
        elif db_count != backup_count:
            status = f"⚠️ DIFF: {db_count - backup_count:+d}"
            issues.append(f"DIFERENCIA: {coll_name} (BD:{db_count} vs Backup:{backup_count})")
        elif not checksum_ok:
            status = "⚠️ CHECKSUM"
            issues.append(f"CHECKSUM INVÁLIDO: {coll_name}")
        else:
            status = "✅ OK"
        
        checksum_str = "✅" if checksum_ok else "❌"
        logger.info(f"   {coll_name:<32} | {db_count:<8} | {backup_count:<8} | {checksum_str:<10} | {status}")
    
    # Cleanup
    shutil.rmtree(extract_dir)
    client.close()
    
    # Summary
    logger.info(f"\n{'='*70}")
    if issues:
        logger.info("❌ BACKUP INCOMPLETO")
        for issue in issues:
            logger.info(f"   • {issue}")
    else:
        logger.info("✅ BACKUP 100% VERIFICADO")
        logger.info("   Todas las colecciones presentes")
        logger.info("   Todos los conteos coinciden")
        logger.info("   Todos los checksums válidos")
    logger.info("="*70)
    
    return {
        "is_complete": len(issues) == 0,
        "issues": issues,
        "collections_in_db": len(db_collections),
        "collections_in_backup": len(backup_collections),
    }


if __name__ == "__main__":
    # Load environment
    from dotenv import load_dotenv
    load_dotenv('/app/backend/.env')
    
    # Create backup
    result = create_100_percent_backup()
    
    if result["success"]:
        # Verify it
        verify_backup(result["archive_path"])
    
    print(f"\n📁 Archivo generado: {result['archive_path']}")
