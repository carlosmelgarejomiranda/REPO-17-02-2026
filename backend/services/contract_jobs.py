"""
UGC Platform - Campaign Contract Jobs
Automated tasks for:
1. Monthly slot reloading based on contract
2. Auto-rejection of pending applications 30 days after contract expiration
"""

from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os

async def get_db():
    """Get database connection"""
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    return client['test_database']

async def reload_campaign_slots():
    """
    Check all active campaigns and reload slots if reload date has passed.
    Called periodically (e.g., daily via cron or on app startup).
    """
    db = await get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Find campaigns with active contracts where reload date has passed
    campaigns = await db.ugc_campaigns.find({
        "contract.is_active": True,
        "contract.next_reload_date": {"$lte": now_iso},
        "status": {"$in": ["live", "in_production"]}
    }, {"_id": 0}).to_list(100)
    
    reloaded_count = 0
    
    for campaign in campaigns:
        contract = campaign.get("contract", {})
        end_date_str = contract.get("end_date")
        
        if not end_date_str:
            continue
            
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        
        # Check if contract has expired
        if now > end_date:
            # Contract expired - deactivate and make invisible to creators
            await db.ugc_campaigns.update_one(
                {"id": campaign["id"]},
                {
                    "$set": {
                        "contract.is_active": False,
                        "visible_to_creators": False,
                        "updated_at": now_iso
                    }
                }
            )
            print(f"Campaign {campaign['id']} contract expired - deactivated")
            continue
        
        # Reload slots
        monthly_deliverables = contract.get("monthly_deliverables", 0)
        current_available = campaign.get("available_slots", 0)
        current_total = campaign.get("total_slots_loaded", 0)
        
        # Calculate next reload date (same day next month)
        current_reload = datetime.fromisoformat(contract["next_reload_date"].replace('Z', '+00:00'))
        next_reload = add_month(current_reload)
        
        # Don't set next reload if it would be after contract end
        if next_reload > end_date:
            next_reload_str = None
        else:
            next_reload_str = next_reload.isoformat()
        
        # Update campaign with new slots
        await db.ugc_campaigns.update_one(
            {"id": campaign["id"]},
            {
                "$set": {
                    "available_slots": current_available + monthly_deliverables,
                    "total_slots_loaded": current_total + monthly_deliverables,
                    "slots": current_total + monthly_deliverables,  # For backwards compat
                    "contract.next_reload_date": next_reload_str,
                    "contract.total_slots_loaded": current_total + monthly_deliverables,
                    "updated_at": now_iso
                }
            }
        )
        
        reloaded_count += 1
        print(f"Campaign {campaign['id']}: Reloaded {monthly_deliverables} slots. Next reload: {next_reload_str}")
    
    return reloaded_count

async def auto_reject_expired_applications():
    """
    Reject pending applications 30 days after campaign contract expiration.
    """
    db = await get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    # Date 30 days ago
    cutoff_date = (now - timedelta(days=30)).isoformat()
    
    # Find expired campaigns (contract ended more than 30 days ago)
    expired_campaigns = await db.ugc_campaigns.find({
        "contract.is_active": False,
        "contract.end_date": {"$lte": cutoff_date}
    }, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    
    rejected_count = 0
    
    for campaign in expired_campaigns:
        # Find pending applications for this campaign
        result = await db.ugc_applications.update_many(
            {
                "campaign_id": campaign["id"],
                "status": {"$in": ["applied", "shortlisted"]}
            },
            {
                "$set": {
                    "status": "rejected",
                    "rejection_reason": "Campaña expirada - rechazo automático",
                    "rejected_at": now_iso,
                    "auto_rejected": True
                }
            }
        )
        
        if result.modified_count > 0:
            rejected_count += result.modified_count
            print(f"Campaign {campaign['id']}: Auto-rejected {result.modified_count} applications")
    
    return rejected_count

def add_month(date: datetime) -> datetime:
    """Add one month to a date, handling month boundaries."""
    month = date.month + 1
    year = date.year
    day = date.day
    
    if month > 12:
        month = 1
        year += 1
    
    # Handle end of month cases
    import calendar
    max_day = calendar.monthrange(year, month)[1]
    if day > max_day:
        day = max_day
    
    return date.replace(year=year, month=month, day=day)

async def run_all_contract_jobs():
    """Run all contract-related jobs."""
    print(f"[{datetime.now()}] Running contract jobs...")
    
    reloaded = await reload_campaign_slots()
    print(f"  - Reloaded slots for {reloaded} campaigns")
    
    rejected = await auto_reject_expired_applications()
    print(f"  - Auto-rejected {rejected} applications")
    
    return {"reloaded_campaigns": reloaded, "rejected_applications": rejected}

# Entry point for manual execution
if __name__ == "__main__":
    asyncio.run(run_all_contract_jobs())
