import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def create_resume_pdf(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=36,
        bottomMargin=36
    )
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=6
    )

    contact_style = ParagraphStyle(
        'Contact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=12,
        spaceAfter=3
    )

    company_style = ParagraphStyle(
        'Company',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0f172a')
    )

    # 1. Header
    story.append(Paragraph("AYUDH POGULWAR", title_style))
    story.append(Paragraph("AI Research & Engineering Intern | Fullstack Developer", subtitle_style))
    story.append(Paragraph("Nagpur, India • ayudh@example.com • linkedin.com/in/ayudh • github.com/ayudhpogulwar", contact_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=10))

    # 2. Executive Summary
    story.append(Paragraph("PROFESSIONAL SUMMARY", section_heading))
    story.append(Paragraph(
        "Proactive and results-driven Computer Science student and AI Engineer with deep hands-on expertise in <b>Python, Natural Language Processing (NLP), Machine Learning, React.js, and Django REST APIs</b>. Experienced in designing semantic talent alignment architectures, embedding-based recommendation engines, and high-performance fullstack web applications.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # 3. Technical Skills
    story.append(Paragraph("CORE TECHNICAL SKILLS", section_heading))
    skills_data = [
        [Paragraph("<b>Programming Languages:</b>", body_style), Paragraph("Python, JavaScript, TypeScript, SQL, C/C++", body_style)],
        [Paragraph("<b>AI & Data Science:</b>", body_style), Paragraph("Machine Learning, Deep Learning, spaCy NLP, PyTorch, Sentence-BERT, Scikit-Learn", body_style)],
        [Paragraph("<b>Web & Frameworks:</b>", body_style), Paragraph("React.js, Node.js, Django REST Framework, Vite, HTML5, CSS3, TailwindCSS", body_style)],
        [Paragraph("<b>Databases & Cloud:</b>", body_style), Paragraph("MySQL, SQLite, PostgreSQL, REST APIs, Git & GitHub, Docker Basics", body_style)]
    ]
    t = Table(skills_data, colWidths=[140, 390])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

    # 4. Professional & Project Experience
    story.append(Paragraph("PROFESSIONAL EXPERIENCE & KEY PROJECTS", section_heading))
    
    # Item 1
    story.append(Paragraph("<b>Semantic Talent Alignment & Placement Portal</b> | <i>Lead AI Fullstack Developer</i>", company_style))
    story.append(Paragraph("• Implemented automated resume parsing pipeline using spaCy NLP and regex taxonomy matching to extract key skill vectors from PDF/DOCX documents.", bullet_style))
    story.append(Paragraph("• Integrated bidirectional cosine similarity scoring with Sentence-BERT embeddings to calculate student-to-opportunity fit percentages in real time.", bullet_style))
    story.append(Paragraph("• Built dynamic Verified Skill Matrix dashboard in React enabling instant tag management and automated readiness score updates.", bullet_style))
    story.append(Spacer(1, 4))

    # Item 2
    story.append(Paragraph("<b>AI Research & Machine Learning Project Intern</b> | <i>Deep Learning NLP Lab</i>", company_style))
    story.append(Paragraph("• Researched and fine-tuned Transformer-based models on academic & industry classification datasets, improving precision by 18%.", bullet_style))
    story.append(Paragraph("• Created modular RESTful microservice endpoints in Django for real-time inference and student eligibility validation.", bullet_style))
    story.append(Paragraph("• Collaborated with faculty mentors to design schema-validated SQL queries handling hundreds of concurrent student submissions.", bullet_style))
    story.append(Spacer(1, 8))

    # 5. Education
    story.append(Paragraph("EDUCATION", section_heading))
    edu_data = [
        [
            Paragraph("<b>Bachelor of Technology (B.Tech) in Computer Science & Engineering</b>", company_style),
            Paragraph("<b>2022 - 2026</b>", ParagraphStyle('Right', parent=body_style, alignment=2))
        ],
        [
            Paragraph("G H Raisoni Institute of Engineering and Technology, Nagpur • CGPA: 8.8 / 10.0", body_style),
            Paragraph("Nagpur, India", ParagraphStyle('Right', parent=body_style, alignment=2))
        ]
    ]
    edu_table = Table(edu_data, colWidths=[380, 150])
    edu_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('TOPPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(edu_table)
    story.append(Spacer(1, 8))

    # 6. Certifications & Achievements
    story.append(Paragraph("CERTIFICATIONS & HONORS", section_heading))
    story.append(Paragraph("• <b>Deep Learning Specialization</b> — Coursera / DeepLearning.AI", bullet_style))
    story.append(Paragraph("• <b>Full Stack Web Development with React & Python</b> — Certified Professional", bullet_style))
    story.append(Paragraph("• <b>Winner / Finalist</b> — Regional Hackathon for AI Career Intelligence Innovation", bullet_style))

    doc.build(story)
    print(f"Generated PDF successfully at: {output_path}")

if __name__ == "__main__":
    create_resume_pdf("public/Ayudh_Pogulwar_AI_Intern.pdf")
    create_resume_pdf("backend/media/resumes/Ayudh_Pogulwar_AI_Intern.pdf")
