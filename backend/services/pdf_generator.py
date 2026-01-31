"""
PDF Report Generator for UGC Campaigns
======================================
Generates professional PDF reports for campaign performance.
"""

from io import BytesIO
from datetime import datetime, timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# Avenue brand colors
AVENUE_GOLD = colors.HexColor("#d4a968")
AVENUE_BLACK = colors.HexColor("#0a0a0a")
AVENUE_GRAY = colors.HexColor("#666666")
AVENUE_LIGHT = colors.HexColor("#f5ede4")


def create_campaign_report_pdf(campaign: dict, applications: list, stats: dict) -> BytesIO:
    """
    Generate a PDF report for a UGC campaign.
    
    Args:
        campaign: Campaign data dict
        applications: List of applications with creator data
        stats: Aggregated statistics
    
    Returns:
        BytesIO buffer with PDF content
    """
    buffer = BytesIO()
    
    # Create document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=AVENUE_BLACK,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=AVENUE_GRAY,
        spaceAfter=10,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=AVENUE_BLACK,
        spaceBefore=20,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=AVENUE_BLACK,
        spaceAfter=8
    )
    
    # Build content
    story = []
    
    # Header
    story.append(Paragraph("AVENUE", title_style))
    story.append(Paragraph("Reporte de Campaña UGC", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Campaign Info
    story.append(Paragraph("Información de la Campaña", heading_style))
    
    campaign_name = campaign.get('name', 'Sin nombre')
    brand_name = campaign.get('brand_name', 'Sin marca')
    status = campaign.get('status', 'unknown')
    created_at = campaign.get('created_at', '')
    
    # Format dates
    if created_at:
        try:
            if isinstance(created_at, str):
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            else:
                dt = created_at
            created_at = dt.strftime('%d/%m/%Y')
        except:
            created_at = 'N/A'
    
    # Campaign details table
    campaign_data = [
        ['Campo', 'Valor'],
        ['Nombre', campaign_name],
        ['Marca', brand_name],
        ['Estado', status.upper()],
        ['Fecha de creación', created_at],
        ['Slots disponibles', str(campaign.get('slots_available', 0))],
        ['Slots confirmados', str(campaign.get('slots_confirmed', 0))],
    ]
    
    campaign_table = Table(campaign_data, colWidths=[4*cm, 10*cm])
    campaign_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), AVENUE_GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, AVENUE_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, AVENUE_LIGHT]),
    ]))
    story.append(campaign_table)
    story.append(Spacer(1, 20))
    
    # Statistics
    story.append(Paragraph("Estadísticas Generales", heading_style))
    
    total_apps = stats.get('total_applications', len(applications))
    confirmed = stats.get('confirmed', 0)
    pending = stats.get('pending', 0)
    rejected = stats.get('rejected', 0)
    delivered = stats.get('delivered', 0)
    
    stats_data = [
        ['Métrica', 'Valor'],
        ['Total Aplicaciones', str(total_apps)],
        ['Confirmados', str(confirmed)],
        ['Pendientes', str(pending)],
        ['Rechazados', str(rejected)],
        ['Con Entregas', str(delivered)],
    ]
    
    # Calculate percentages if we have applications
    if total_apps > 0:
        stats_data.append(['Tasa de Confirmación', f"{(confirmed/total_apps*100):.1f}%"])
        if confirmed > 0:
            stats_data.append(['Tasa de Entrega', f"{(delivered/confirmed*100):.1f}%"])
    
    stats_table = Table(stats_data, colWidths=[6*cm, 8*cm])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), AVENUE_BLACK),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, AVENUE_GRAY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, AVENUE_LIGHT]),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 30))
    
    # Creators List
    if applications:
        story.append(Paragraph("Creadores Participantes", heading_style))
        
        # Table headers
        creators_data = [
            ['Creador', 'Estado', 'Instagram', 'Entregas']
        ]
        
        for app in applications[:50]:  # Limit to 50 for PDF size
            creator = app.get('creator', {})
            creator_name = creator.get('full_name', creator.get('name', 'N/A'))
            app_status = app.get('status', 'pending')
            instagram = creator.get('instagram_handle', 'N/A')
            deliverables = len(app.get('deliverables', []))
            
            creators_data.append([
                creator_name[:30],
                app_status,
                f"@{instagram}" if instagram != 'N/A' else 'N/A',
                str(deliverables)
            ])
        
        creators_table = Table(creators_data, colWidths=[5*cm, 3*cm, 4*cm, 2*cm])
        creators_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), AVENUE_GOLD),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, AVENUE_GRAY),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, AVENUE_LIGHT]),
        ]))
        story.append(creators_table)
        
        if len(applications) > 50:
            story.append(Spacer(1, 10))
            story.append(Paragraph(
                f"* Mostrando 50 de {len(applications)} creadores",
                body_style
            ))
    
    story.append(Spacer(1, 40))
    
    # Footer
    generated_at = datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=AVENUE_GRAY,
        alignment=TA_CENTER
    )
    story.append(Paragraph(
        f"Reporte generado automáticamente por Avenue Platform • {generated_at}",
        footer_style
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer


def create_creators_report_pdf(creators: list, filters: dict = None) -> BytesIO:
    """
    Generate a PDF report for creators list.
    
    Args:
        creators: List of creator data
        filters: Applied filters for the report header
    
    Returns:
        BytesIO buffer with PDF content
    """
    buffer = BytesIO()
    
    # Create document in landscape for more columns
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=AVENUE_BLACK,
        spaceAfter=10,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=AVENUE_GRAY,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    story = []
    
    # Header
    story.append(Paragraph("AVENUE - Reporte de Creadores UGC", title_style))
    
    filter_text = "Todos los creadores"
    if filters:
        filter_parts = []
        if filters.get('status'):
            filter_parts.append(f"Estado: {filters['status']}")
        if filters.get('category'):
            filter_parts.append(f"Categoría: {filters['category']}")
        if filter_parts:
            filter_text = " | ".join(filter_parts)
    
    story.append(Paragraph(filter_text, subtitle_style))
    
    # Stats summary
    total = len(creators)
    verified = sum(1 for c in creators if c.get('verified'))
    
    story.append(Paragraph(f"Total: {total} creadores | Verificados: {verified}", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Creators table
    if creators:
        table_data = [
            ['Nombre', 'Instagram', 'Categoría', 'Seguidores', 'Estado', 'Campañas', 'Verificado']
        ]
        
        for creator in creators[:100]:  # Limit for PDF size
            name = creator.get('full_name', creator.get('name', 'N/A'))[:25]
            instagram = creator.get('instagram_handle', 'N/A')
            category = creator.get('content_categories', ['N/A'])[0] if creator.get('content_categories') else 'N/A'
            followers = creator.get('followers_count', 0)
            status = creator.get('status', 'pending')
            campaigns = creator.get('campaigns_completed', 0)
            verified = '✓' if creator.get('verified') else ''
            
            # Format followers
            if followers >= 1000000:
                followers_str = f"{followers/1000000:.1f}M"
            elif followers >= 1000:
                followers_str = f"{followers/1000:.1f}K"
            else:
                followers_str = str(followers)
            
            table_data.append([
                name,
                f"@{instagram}" if instagram != 'N/A' else '-',
                category[:15],
                followers_str,
                status,
                str(campaigns),
                verified
            ])
        
        col_widths = [5*cm, 4*cm, 3.5*cm, 2.5*cm, 2.5*cm, 2*cm, 2*cm]
        table = Table(table_data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), AVENUE_BLACK),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (3, 0), (6, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, AVENUE_GRAY),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, AVENUE_LIGHT]),
        ]))
        story.append(table)
        
        if len(creators) > 100:
            story.append(Spacer(1, 10))
            note_style = ParagraphStyle('Note', fontSize=8, textColor=AVENUE_GRAY)
            story.append(Paragraph(f"* Mostrando 100 de {len(creators)} creadores", note_style))
    
    # Footer
    story.append(Spacer(1, 20))
    generated_at = datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M UTC')
    footer_style = ParagraphStyle('Footer', fontSize=8, textColor=AVENUE_GRAY, alignment=TA_CENTER)
    story.append(Paragraph(f"Generado por Avenue Platform • {generated_at}", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    
    return buffer
