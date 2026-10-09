"""Build the Korean CUTY StarUML workbook with original vector diagrams."""
from pathlib import Path
from io import BytesIO
import json
import math
import struct
import re
from xml.sax.saxutils import escape

from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/pdf/CUTY_StarUML_처음부터_따라하기.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)


def asar_read(path):
    with open('/Applications/StarUML.app/Contents/Resources/app.asar', 'rb') as f:
        header = f.read(16)
        node = json.loads(f.read(struct.unpack_from('<I', header, 12)[0]))
        for part in path.split('/'):
            node = node['files'][part]
        f.seek(8 + struct.unpack_from('<I', header, 4)[0] + int(node['offset']))
        return f.read(node['size'])


for name, weight in [('KR', 'Regular'), ('KB', 'Bold')]:
    data = asar_read(f'resources/fonts/NotoSans/NotoSansKR-Subset-{weight}.ttf')
    pdfmetrics.registerFont(TTFont(name, BytesIO(data)))
pdfmetrics.registerFont(TTFont('Fallback', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
pdfmetrics.registerFontFamily('KR', normal='KR', bold='KB', italic='KR', boldItalic='KB')

W, H = A4
M = 42
CW = W - M * 2
BLUE = colors.HexColor('#2879C9')
INK = colors.HexColor('#263D57')
MUTED = colors.HexColor('#64778B')
BORDER = colors.HexColor('#DCE7F1')
PALE = colors.HexColor('#EDF6FF')
MINT = colors.HexColor('#E8F7F2')
PINK = colors.HexColor('#FFF0F1')
AMBER = colors.HexColor('#FFF5DD')
WHITE = colors.white
PAGE_META = []
ALL_TEXT = []


def safe_markup(s):
    # The bundled Korean font covers everyday Korean; use an embedded fallback
    # for rarer syllables/symbols, preserving selectable text in the PDF.
    chunks = re.split(r'(<[^>]*>)', s)
    for i in range(0, len(chunks), 2):
        chunks[i] = ''.join(ch if ord(ch) in pdfmetrics.getFont('KR').face.charToGlyph
                            else f'<font name="Fallback">{ch}</font>' for ch in chunks[i])
    return ''.join(chunks)


def para_obj(s, size=11.4, leading=None, color=INK, bold=False, align=0):
    ALL_TEXT.append(re.sub('<[^>]*>', '', s))
    st = ParagraphStyle('p', fontName='KB' if bold else 'KR', fontSize=size,
                        leading=leading or size * 1.52, textColor=color,
                        wordWrap='CJK', alignment=align, spaceAfter=0,
                        allowWidows=0, allowOrphans=0)
    return Paragraph(safe_markup(s), st)


def put(c, s, x, top, width, size=11.4, leading=None, color=INK, bold=False, align=0):
    p = para_obj(s, size, leading, color, bold, align)
    _, h = p.wrap(width, 2000)
    p.drawOn(c, x, H-top-h)
    return h


class Book:
    def __init__(self):
        self.c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
        self.c.setTitle('CUTY StarUML 처음부터 따라하기 - 분석·설계 산출물 설명서')
        self.c.setAuthor('CUTY 프로젝트 학습 가이드')
        self.c.setSubject('StarUML 7.1.1 / 한국어 입문 설명서 / 2026-10-06')
        self.n = 0
        self.y = 0
        self.page_open = False

    def page(self, title, subtitle='', section='따라하기', sources=''):
        if self.page_open:
            self.finish()
        self.n += 1
        self.page_open = True
        self.sources = sources
        self.c.setFillColor(WHITE)
        self.c.rect(0, 0, W, H, fill=1, stroke=0)
        self.c.setFillColor(BLUE)
        self.c.rect(M, H-42, 24, 4, fill=1, stroke=0)
        put(self.c, 'CUTY  /  STARUML WORKBOOK', M+34, 28, 320, 8.5, color=MUTED, bold=True)
        put(self.c, section, W-M-130, 28, 130, 8.5, color=MUTED, align=2)
        self.c.bookmarkPage(f'p{self.n}')
        self.c.addOutlineEntry(f'{self.n:02d}  {re.sub("<[^>]*>", " ", title)}', f'p{self.n}', level=0)
        titleh = put(self.c, title, M, 61, CW, 24, leading=32, bold=True)
        self.y = 61 + titleh + 9
        if subtitle:
            self.y += put(self.c, subtitle, M, self.y, CW, 11.5, color=MUTED) + 17
        else:
            self.y += 12
        PAGE_META.append((self.n, title))

    def finish(self):
        if self.y > 759:
            raise ValueError(f'Page overflow {self.n}: {self.y:.1f}')
        if self.sources:
            put(self.c, self.sources, M, 768, CW, 7.5, color=MUTED)
        self.c.setStrokeColor(BORDER)
        self.c.setLineWidth(.6)
        self.c.line(M, 49, W-M, 49)
        put(self.c, '처음에는 한 장씩. 같은 이름은 끝까지.', M, 804, CW-65, 8, color=MUTED)
        put(self.c, f'{self.n:02d}', W-M-45, 801, 45, 10, color=BLUE, bold=True, align=2)
        self.c.showPage()
        self.page_open = False

    def p(self, s, size=11.4, gap=10, color=INK, bold=False):
        self.y += put(self.c, s, M, self.y, CW, size, color=color, bold=bold) + gap

    def label(self, s):
        self.y += 5
        self.p(s, 13, gap=7, bold=True, color=BLUE)

    def box(self, title, body, fill=PALE, size=11.1):
        a = para_obj(title, 12, bold=True)
        b = para_obj(body, size)
        _, ah = a.wrap(CW-28, 2000)
        _, bh = b.wrap(CW-28, 2000)
        h = ah + bh + 30
        self.c.setFillColor(fill)
        self.c.roundRect(M, H-self.y-h, CW, h, 10, fill=1, stroke=0)
        a.drawOn(self.c, M+14, H-self.y-12-ah)
        b.drawOn(self.c, M+14, H-self.y-18-ah-bh)
        self.y += h+12

    def steps(self, items, start=1, size=11.2):
        for i, s in enumerate(items, start):
            self.c.setFillColor(BLUE)
            self.c.circle(M+10, H-self.y-10, 10, fill=1, stroke=0)
            put(self.c, str(i), M+1, self.y+1, 18, 9.2, color=WHITE, bold=True, align=1)
            hh = put(self.c, s, M+29, self.y-1, CW-29, size)
            self.y += max(23, hh) + 9

    def table(self, headers, rows, widths, size=10.2):
        data = [[para_obj(escape(str(x)), size, color=WHITE, bold=True) for x in headers]]
        data += [[para_obj(str(x), size) for x in row] for row in rows]
        tb = Table(data, colWidths=widths, hAlign='LEFT')
        tb.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BLUE),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, PALE]),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 9),
            ('LINEBELOW', (0,0), (-1,0), .5, BLUE),
            ('LINEBELOW', (0,1), (-1,-1), .4, BORDER),
        ]))
        _, hh = tb.wrap(CW, 2000)
        tb.drawOn(self.c, M, H-self.y-hh)
        self.y += hh+13

    def diagram(self, height, draw, caption=''):
        self.c.saveState()
        draw(Diagram(self.c, M, self.y, CW, height))
        self.c.restoreState()
        self.y += height
        if caption:
            self.y += put(self.c, caption, M, self.y+4, CW, 9, color=MUTED)+8
        self.y += 12

    def end(self):
        self.finish()
        self.c.save()


class Diagram:
    def __init__(self,c,x,t,w,h):
        self.c,self.x,self.t,self.w,self.h = c,x,t,w,h

    def txt(self,s,x,y,w,size=10.5,color=INK,bold=False,align=1):
        return put(self.c,s,self.x+x,self.t+y,w,size,color=color,bold=bold,align=align)

    def rect(self,x,y,w,h,text='',fill=PALE,round=8,size=10.7,stroke=BORDER):
        self.c.setFillColor(fill)
        self.c.setStrokeColor(stroke)
        self.c.setLineWidth(1)
        if round:
            self.c.roundRect(self.x+x,H-self.t-y-h,w,h,round,fill=1,stroke=1)
        else:
            self.c.rect(self.x+x,H-self.t-y-h,w,h,fill=1,stroke=1)
        if text:
            p=para_obj(text,size,align=1)
            _,ph=p.wrap(w-14,1000)
            p.drawOn(self.c,self.x+x+7,H-self.t-y-(h-ph)/2-ph)

    def line(self,points,dash=False,color=INK,width=1.1,arrow=False,filled=False):
        c=self.c
        c.setStrokeColor(color); c.setLineWidth(width)
        c.setDash(4,3) if dash else c.setDash()
        p=c.beginPath();p.moveTo(self.x+points[0][0],H-self.t-points[0][1])
        for x,y in points[1:]:p.lineTo(self.x+x,H-self.t-y)
        c.drawPath(p)
        c.setDash()
        if arrow:
            x1,y1=points[-2];x2,y2=points[-1]
            angle=math.atan2(y2-y1,x2-x1)
            ll=6
            pts=[(x2-ll*math.cos(angle-.48), y2-ll*math.sin(angle-.48)),(x2,y2),
                 (x2-ll*math.cos(angle+.48), y2-ll*math.sin(angle+.48))]
            p=c.beginPath();p.moveTo(self.x+pts[0][0],H-self.t-pts[0][1])
            for x,y in pts[1:]:p.lineTo(self.x+x,H-self.t-y)
            if filled:p.close()
            c.setFillColor(color);c.drawPath(p,stroke=1,fill=int(filled))

    def ellipse(self,x,y,w,h,text):
        self.c.setStrokeColor(BLUE);self.c.setFillColor(WHITE)
        self.c.ellipse(self.x+x,H-self.t-y-h,self.x+x+w,H-self.t-y,fill=1,stroke=1)
        p=para_obj(text,10.6,align=1);_,ph=p.wrap(w-16,1000)
        p.drawOn(self.c,self.x+x+8,H-self.t-y-(h-ph)/2-ph)

    def actor(self,x,y,label='여행자'):
        c=self.c;c.setLineWidth(1.4);c.setStrokeColor(INK)
        c.circle(self.x+x,H-self.t-y-9,8,stroke=1,fill=0)
        self.line([(x,y+17),(x,y+43)])
        self.line([(x-18,y+27),(x+18,y+27)])
        self.line([(x,y+43),(x-15,y+62)])
        self.line([(x,y+43),(x+15,y+62)])
        self.txt(label,x-36,y+69,72,11)

    def dot(self,x,y,final=False):
        c=self.c;c.setFillColor(INK);c.setStrokeColor(INK)
        c.circle(self.x+x,H-self.t-y,5,fill=1,stroke=0)
        if final:c.circle(self.x+x,H-self.t-y,8,fill=0,stroke=1)

    def diamond(self,x,y,w=38,h=28):
        c=self.c;c.setFillColor(AMBER);c.setStrokeColor(INK)
        p=c.beginPath();p.moveTo(self.x+x,H-self.t-y-h/2)
        for xx,yy in [(x+w/2,y),(x+w,y+h/2),(x+w/2,y+h)]:p.lineTo(self.x+xx,H-self.t-yy)
        p.close();c.drawPath(p,fill=1,stroke=1)

    def package(self,x,y,w,h,title,body):
        self.rect(x,y+12,w,h-12,'',round=0,fill=PALE,stroke=BLUE)
        self.rect(x,y,68,13,'',round=0,fill=PALE,stroke=BLUE)
        self.txt(title,x+8,y+24,w-16,13,bold=True)
        self.txt(body,x+10,y+50,w-20,10,color=MUTED)

    def klass(self,x,y,w,name,attrs,ops,fill=WHITE):
        hh=34+max(28,len(attrs)*17+10)+max(28,len(ops)*17+10)
        self.rect(x,y,w,hh,'',fill=fill,round=0,stroke=BLUE)
        self.txt(name,x+4,y+7,w-8,11,bold=True)
        aheight=max(28,len(attrs)*17+10)
        self.line([(x,y+34),(x+w,y+34)],color=BLUE,width=.7)
        self.line([(x,y+34+aheight),(x+w,y+34+aheight)],color=BLUE,width=.7)
        for i,s in enumerate(attrs):self.txt(escape(s),x+9,y+40+i*17,w-18,9.4,align=0)
        for i,s in enumerate(ops):self.txt(escape(s),x+9,y+40+aheight+i*17,w-18,9.4,align=0)
        return hh


def sequence(d, names, msgs, top=0, height=None, size=10, labelsize=9.7, boxwidth=90):
    n=len(names); xs=[boxwidth/2+i*(d.w-boxwidth)/(n-1) for i in range(n)]
    bot=(height or d.h)-8
    for i,name in enumerate(names):
        xx=max(0,min(d.w-boxwidth,xs[i]-boxwidth/2))
        d.rect(xx,top,boxwidth,42,name,round=0,fill=PALE,size=size)
        d.line([(xs[i],top+42),(xs[i],bot)],dash=True,color=MUTED,width=.65)
    for a,b,y,label,reply in msgs:
        if a==b:
            d.line([(xs[a],y),(xs[a]+25,y),(xs[a]+25,y+18),(xs[a],y+18)],arrow=True,dash=reply,filled=not reply)
            d.txt(label,xs[a]+29,y-3,min(170,d.w-xs[a]-29),labelsize,align=0)
        else:
            d.line([(xs[a],y),(xs[b],y)],dash=reply,arrow=True,filled=not reply)
            lo=min(xs[a],xs[b]);wi=abs(xs[b]-xs[a])
            labelp=para_obj(label,labelsize,align=1)
            _,labelh=labelp.wrap(wi-6,1000)
            d.txt(label,lo+3,y-labelh-5,wi-6,labelsize,align=1)
    return xs


B=Book()

# 01 - Cover
B.page('StarUML\n처음부터 따라하기'.replace('\n','<br/>'),
       'CUTY로 배우는 분석·설계 산출물 만들기',section='처음 여는 설명서')
B.p('한 번에 하나씩 누르면 됩니다.',20,gap=8,bold=True)
B.p('어려운 이름은 쉬운 말로 풀었습니다.<br/>메뉴 이름은 화면에서 찾을 수 있게 영어도 함께 적었습니다.',12.5)

def cover(d):
    labels=[('누가 무엇을 할까?','유즈케이스'),('어떤 순서일까?','액티비티'),
            ('누가 누구에게 말할까?','시퀀스'),('어떤 부품이 있을까?','클래스')]
    for i,(a,b) in enumerate(labels):
        x=(i%2)*260;y=(i//2)*110
        d.rect(x,y,247,91,'',fill=[PALE,MINT,AMBER,PINK][i],stroke=WHITE)
        d.txt(f'0{i+1}',x+15,y+11,40,11,color=BLUE,bold=True,align=0)
        d.txt(a,x+15,y+35,218,15,bold=True,align=0)
        d.txt(b,x+15,y+64,218,10,color=MUTED,align=0)
B.diagram(212,cover)
B.box('이 책으로 만들 것',
      '유즈케이스도 · 명세서 · 유즈케이스별 시퀀스 · 액티비티도<br/>'
      '패키지 다이어그램 · 패키지별 클래스도 · 설계 시퀀스 · 통신도 · 상태도',MINT)
B.p('기준: StarUML 7.1.1 / Mac 중심, Windows 함께 안내<br/>'
    '확인일: 2026년 10월 6일<br/>이 책의 도형과 화면 배치 그림은 이해를 돕기 위해 직접 만든 예시입니다.',9.5,color=MUTED)

# 02 - TOC
B.page('필요한 곳부터 펼쳐요','처음이라면 3쪽부터 순서대로 따라오세요.',section='읽는 순서')
B.table(['할 일','쪽'],[
    ['범위 정하기 · 산출물 이름 이해하기','3-4'],
    ['설치 · 화면 읽기 · 기본 설정 · 파일 정리','5-9'],
    ['유즈케이스도 그리기 · 관계선 이해하기','10-12'],
    ['유즈케이스 명세서 작성하기','13-16'],
    ['액티비티도 그리기','17'],
    ['분석 시퀀스: 7개 유즈케이스 모두 만들기','18-20'],
    ['패키지 아키텍처 · 4개 패키지의 클래스도','21-26'],
    ['설계 시퀀스 · 교류도/통신도 · 상태도','27-29'],
    ['전체 서비스로 넓히기 · PDF 저장 · 최종 점검','30-33'],
    ['공식 설명서와 근거','34'],
], [CW-62,62],size=11)
B.box('추천 순서',
      '요구사항 → 유즈케이스도 → 명세서 → 액티비티/분석 시퀀스<br/>'
      '→ 패키지 → 클래스 ↔ 설계 시퀀스/통신도 → 상태 점검',MINT)
B.p('상태도는 명세서를 읽다가 먼저 그려도 됩니다. 그림을 그리며 빠진 내용을 발견하면 앞의 문서도 함께 고칩니다.',11)

# 03 - Scope
B.page('그리기 전에, 약속부터','무엇을 만드는지 한 문장으로 정해요.',section='준비 01')
B.box('CUTY 한 문장', '여행자가 테마를 둘러보고, 여행 옵션을 고른 뒤, 나만의 여행을 저장하는 서비스입니다.')
B.label('이번 책에서 따라 할 연습 범위')
B.p('여행 탐색, 상품 상세, 찜, 옵션 구성, 여행 구성 저장, 저장한 여행 조회, 저장한 여행 수정입니다. 사용자는 “여행자” 한 역할로 시작합니다.')
B.p('허니문·부모님 힐링·골프·아웃도어는 네 가지 테마입니다. 투어 등급·호텔·교통·식사는 여행을 구성하는 네 종류의 옵션입니다.')
B.box('과제 범위는 “요구사항”이 정해요',
      '아직 코딩하지 않은 기능도 과제 요구사항에 있다면 분석·설계에 넣습니다. '
      '예를 들어 로그인·예약·결제를 요구받았다면 반드시 포함하세요. '
      '현재 화면에 없다는 이유로 빼면 안 됩니다.',AMBER)
B.label('문서에 세 가지 표시를 붙여요')
B.table(['표시','뜻'],[
    ['현재 구현','프로젝트 문서로 확인한 기능. 찜과 여행 구성은 브라우저 localStorage에 저장합니다.'],
    ['연습 설계','이 책에서 설명을 위해 정한 책임·클래스·오류 흐름입니다. 실제 코드와 같다고 가정하지 않습니다.'],
    ['미정','예약·결제·로그인 정책 등 팀이 아직 정하지 않은 내용입니다. 결정이 필요하다고 씁니다.'],
],[97,CW-97],size=10.6)
B.p('제출 전에는 교수님 과제 지시문과 팀 요구사항을 먼저 대조하세요. 전체 서비스로 넓히는 방법은 30쪽에 있습니다.',10.5,color=MUTED)

# 04 - Terms
B.page('이름은 달라도, 질문은 쉬워요','그림마다 대답하는 질문이 하나씩 달라요.',section='준비 02',sources='용어 기준: OMG UML 2.5.1 / 공식 링크는 34쪽. 과제별 제출 개수는 수업 지시가 우선입니다.')
B.table(['산출물','쉬운 질문','이 책의 연습 결과'],[
    ['유즈케이스도','누가 무엇을 할까?','전체 지도 1장'],
    ['유즈케이스 명세서','그 일을 어떻게 할까?','UC-01~07, 7개'],
    ['분석 시퀀스','사용자와 시스템이 무슨 말을 주고받을까?','유즈케이스마다 1장, 7장'],
    ['액티비티도','무슨 일을 하고, 어디서 길이 갈릴까?','저장 흐름 1장'],
    ['패키지 다이어그램','부품을 어떤 묶음으로 나눌까?','논리 구조 1장'],
    ['클래스도','각 부품은 무엇을 알고, 무엇을 할까?','연습 패키지 4개, 그림 4장'],
    ['설계 시퀀스 / 통신도','내부 부품들이 어떻게 협력할까?','저장 예시 각 1장'],
    ['상태도','한 대상의 상태가 어떻게 바뀔까?','여행 구성 편집기 1장'],
],[116,226,CW-342],size=10.1)
B.box('“교류도”는 수업에서 뜻을 확인해요',
      '상호작용 다이어그램(Interaction Diagram)이라는 넓은 뜻일 수도 있고, '
      '통신도(Communication Diagram, 과거 Collaboration Diagram)를 뜻할 수도 있습니다. '
      '이 책은 두 경우에 대비해 설계 시퀀스와 통신도를 모두 설명합니다.',AMBER,size=10.6)
B.p('“패키지 수만큼 클래스도”는 이 과제의 제출 규칙으로 따릅니다. UML 자체가 요구하는 고정 개수는 아닙니다. 아키텍처 전체 중 여기서는 패키지 의존 관계를 그립니다.',10.5)

# 05 - Install
B.page('설치하고, 처음 열어요','이미 설치되어 있다면 6쪽으로 가세요.',section='설정 01',sources='확인: staruml.io/download · staruml.io/help · staruml.io/changelog (2026-10-06)')
B.steps([
    '<b>공식 다운로드 페이지를 엽니다.</b><br/><link href="https://staruml.io/download" color="#2879C9">https://staruml.io/download</link>',
    '<b>내 컴퓨터에 맞는 파일을 고릅니다.</b><br/>Mac: Apple 메뉴의 “이 Mac에 관하여”에서 칩을 확인합니다. Apple M 계열이면 Apple (arm64), Intel이면 Intel (x86)을 고릅니다.',
    '<b>설치 파일을 실행합니다.</b><br/>Mac은 내려받은 설치 이미지의 안내에 따라 응용 프로그램 폴더에 넣습니다. Windows는 Windows 설치 파일을 열고 설치 안내를 따릅니다.',
    '<b>StarUML을 엽니다.</b><br/>학교 라이선스가 있다면 학교 안내를 먼저 확인합니다. 키를 받았다면 Help > License Activation...에서 입력합니다.',
    '<b>앱 버전을 확인합니다.</b><br/>About StarUML에서 확인합니다. 이 책은 7.1.1 메뉴를 기준으로 했습니다. 구버전은 위치나 도구 이름이 조금 다를 수 있습니다.',
],size=11.1)
B.box('무료 체험과 제출',
      '공식 안내의 체험 기간은 30일입니다. 체험판에서 내보낸 다이어그램 이미지에는 워터마크가 생깁니다. '
      '제출 규칙과 학교 라이선스를 확인하세요. 필요한 UML 다이어그램은 기본 도구로 연습할 수 있습니다.',AMBER)
B.p('별도 코딩 도구나 확장 플러그인은 이 실습에 필요하지 않습니다. 설치 자체를 이 PDF가 대신 실행하지는 않습니다.',10.5,color=MUTED)

# 06 - UI
B.page('화면은 네 곳만 기억해요','도구 상자, 도화지, 목록, 설명 칸이에요.',section='설정 02',sources='메뉴 근거: StarUML User Interface / 공식 링크는 34쪽.')

def ui(d):
    d.rect(0,0,d.w,285,'',fill=WHITE,round=8)
    d.rect(0,0,d.w,30,'File     Edit     Format     Model     View     Help',fill=INK,round=0,size=10,stroke=INK)
    # Menu text is light for contrast.
    d.c.setFillColor(INK);d.c.rect(d.x,H-d.t-30,d.w,30,fill=1,stroke=0)
    d.txt('File    Edit    Format    Model    View    Help',12,7,d.w-24,10,color=WHITE,align=0)
    d.rect(8,40,100,235,'',fill=PALE,round=4)
    d.txt('① Toolbox',13,52,90,11,bold=True)
    d.txt('도구 상자<br/><br/>Actor<br/>Use Case<br/>Association',16,91,85,10,align=0)
    d.rect(117,40,237,235,'',fill=WHITE,round=4)
    d.txt('② Diagram Area',126,52,219,12,bold=True)
    d.txt('도형을 놓는 도화지',128,87,214,10,color=MUTED)
    d.ellipse(154,149,161,54,'여행 구성 저장')
    d.rect(364,40,139,112,'',fill=MINT,round=4)
    d.txt('③ Model Explorer',370,50,128,10.5,bold=True)
    d.txt('모델 목록<br/>01_분석<br/>02_설계',375,80,117,10,align=0)
    d.rect(364,162,139,113,'',fill=AMBER,round=4)
    d.txt('④ Editors',372,174,122,11,bold=True)
    d.txt('Property: 속성<br/>Style: 모양<br/>Documentation: 설명',374,204,122,9.5,align=0)
B.diagram(287,ui,'실제 화면 캡처가 아닌 위치 안내 그림입니다. 창 크기에 따라 배치가 달라질 수 있습니다.')
B.table(['하고 싶은 일','어디를 볼까?'],[
    ['사람·타원·선을 만들기','왼쪽 Toolbox'],
    ['다른 그림을 열기','오른쪽 Model Explorer에서 그림 이름 더블 클릭'],
    ['이름·조건·선 종류 바꾸기','대상을 누른 다음 Property Editor'],
    ['긴 명세서 쓰기','대상을 누른 다음 Documentation Editor'],
],[180,CW-180],size=11)
B.p('도구 상자가 안 보이면 View > Toolbox, 오른쪽 전체가 안 보이면 View > Navigator를 켭니다.',11)

# 07 - settings
B.page('설정은 이 정도면 충분해요','먼저 저장하고, 큰 글자로 연습해요.',section='설정 03',sources='메뉴 근거: Managing Project · Formatting Elements · Keyboard Shortcuts (34쪽).')
B.steps([
    '<b>새 파일:</b> File > New From Template > UMLMinimal을 누릅니다. 기본 모델 하나로 시작할 수 있습니다.',
    '<b>바로 저장:</b> File > Save As...에서 CUTY_UML_v01.mdj로 저장합니다. .mdj는 다시 편집할 수 있는 원본입니다.',
    '<b>격자 켜기:</b> View > Show Grid를 켭니다. View > Snap to Grid를 켜면 도형을 가지런히 놓기 쉽습니다.',
    '<b>글자 맞추기:</b> 연습 도형을 하나 만든 뒤 선택하고 Format > Font...를 엽니다. 목록에 있는 글꼴로 “여행 저장”을 입력해 봅니다. 시작 크기는 13~14 정도를 권합니다.',
    '<b>줄바꿈 켜기:</b> 긴 글자가 있는 도형을 선택하고 Format > Word Wrap을 켭니다. 글자가 겹치면 도형 폭도 넓힙니다.',
    '<b>설정 창 열기:</b> Mac은 StarUML > Preferences... 또는 Cmd+,입니다. Windows는 File > Preferences...입니다. 지금은 기본값으로 두어도 됩니다.',
],size=11.1)
B.box('저장 단축키 두 개',
      '<b>Mac:</b> 저장 Cmd+S / 되돌리기 Cmd+Z<br/>'
      '<b>Windows:</b> 저장 Ctrl+S / 되돌리기 Ctrl+Z<br/>'
      '그림 한 장을 마칠 때마다 저장하세요. 큰 수정 전에는 v02, v03처럼 사본을 만듭니다.',MINT)
B.p('색은 흰 바탕과 진한 글자만으로도 충분합니다. 내보낸 PDF에서 한글이 보이는지 초반에 한 번 시험하세요.',10.5,color=MUTED)

# 08 - tree
B.page('원본 파일 안에 정리함을 만들어요','분석과 설계가 섞이지 않도록 이름을 붙여요.',section='설정 04',sources='메뉴 근거: Package Diagram · Managing Diagrams (34쪽).')
B.steps([
    'Model Explorer에서 기본 Model을 고릅니다. Property Editor의 name을 <b>CUTY</b>로 바꿉니다.',
    'CUTY를 선택하고 Model > Add > Model로 <b>01_분석</b>, <b>02_설계</b>를 하나씩 만듭니다.',
    '02_설계를 선택하고 Model > Add > Package로 <b>UI, Application, Domain, Storage</b>를 만듭니다.',
],size=11.2)
B.box('이렇게 보이면 됩니다',
      '<b>CUTY</b><br/>'
      '　01_분석<br/>'
      '　　UC_전체 / AD_UC05_저장<br/>'
      '　　SSD_UC01_탐색 ... SSD_UC07_수정<br/>'
      '　02_설계<br/>'
      '　　PKG_전체 / SD_UC05_저장 / COM_UC05_저장<br/>'
      '　　UI → CD_UI<br/>'
      '　　Application → CD_Application<br/>'
      '　　Domain → CD_Domain<br/>'
      '　　Storage → CD_Storage<br/>'
      '　　SM_여행구성편집기',PALE,size=10.7)
B.p('그림을 만들 때는 먼저 담을 Model이나 Package를 누릅니다. 그다음 Model > Add Diagram > 그림 종류를 고릅니다.',11.3)
B.p('Sequence, Activity, Statechart를 추가하면 Interaction, Activity, StateMachine 같은 중간 정리함이 자동으로 생길 수 있습니다. 정상입니다.',10.4,color=MUTED)
B.box('정리용 Model과 설계 Package는 달라요',
      '01_분석과 02_설계는 문서를 정리하는 묶음입니다. 이번 연습의 “패키지 4개”는 UI·Application·Domain·Storage를 말합니다.',AMBER,size=10.5)

# 09 - common operations
B.page('모든 그림에서 쓰는 여섯 동작','이 여섯 가지만 익히면 다음 장들이 쉬워져요.',section='설정 05',sources='메뉴 근거: Editing Elements · Diagram Editor · Managing Diagrams (34쪽).')
B.table(['할 일','따라 하기'],[
    ['도형 만들기','Toolbox에서 도형을 고르고, 도화지에서 마우스를 누른 채 끌어 크기를 정합니다.'],
    ['이름 쓰기','도형을 더블 클릭하거나, 선택한 뒤 Enter를 누릅니다. QuickEdit 창에서 이름을 씁니다.'],
    ['선 연결하기','해당 선 도구를 고릅니다. 출발 도형에서 도착 도형까지 끕니다.'],
    ['이동하기','Esc를 누른 다음 도형을 잡아 옮깁니다. 여러 개는 Shift를 누른 채 선택합니다.'],
    ['가지런히 하기','여러 도형을 선택하고 Format > Alignment > Align Left 등을 고릅니다.'],
    ['화면에 다 보기','View > Fit to Window를 누릅니다. Mac Cmd+9, Windows Ctrl+9입니다.'],
],[100,CW-100],size=11)
B.box('지우기는 두 종류예요',
      '<b>Edit > Delete:</b> 이 그림에서 보이는 도형을 지웁니다. 모델은 남을 수 있습니다.<br/>'
      '<b>Edit > Delete from Model:</b> 모델 자체를 지워서 다른 그림에도 영향을 줍니다.<br/>'
      '연습하다 배치만 지울 때는 먼저 Delete를 사용하세요.',AMBER)
B.box('같은 부품은 목록에서 가져와요',
      '이미 만든 클래스나 액터를 다른 그림에서도 쓰려면 Model Explorer에서 도화지로 끌어옵니다. '
      '이름만 같은 새 부품을 또 만들면 서로 다른 모델이 됩니다.',MINT)
B.p('메뉴를 못 찾으면 View > Command Palette...를 열고 영어 명령을 검색합니다. 도구가 안 맞으면 지금 열린 다이어그램 종류부터 확인하세요.',10.5,color=MUTED)

# 10 - Usecases inventory
B.page('먼저, 할 일에 번호를 붙여요','여행자가 이루려는 목표를 하나씩 적어요.',section='분석 01')
B.table(['번호','유즈케이스 이름','성공하면 무엇이 남을까?'],[
    ['UC-01','여행 탐색','테마·검색어에 맞는 상품 목록'],
    ['UC-02','여행 상품 상세 확인','선택한 상품의 설명과 옵션 정보'],
    ['UC-03','찜 관리','원하는 상품의 찜 등록·해제와 목록'],
    ['UC-04','여행 옵션 구성','선택 옵션과 예상 금액'],
    ['UC-05','여행 구성 저장','브라우저에 저장된 여행 구성'],
    ['UC-06','저장한 여행 조회','저장 목록과 선택한 구성 내용'],
    ['UC-07','저장한 여행 수정','바뀐 내용으로 다시 저장한 구성'],
],[63,171,CW-234],size=11)
B.box('“저장 버튼”보다 “여행 구성 저장”',
      '버튼 이름보다 목표를 적으면 화면이 바뀌어도 설명이 유지됩니다. '
      '액터(Actor)는 서비스를 이용하는 역할입니다. 이번 액터 이름은 “여행자”입니다.')
B.p('옵션 네 개를 각각 독립 유즈케이스로 나눌 필요는 없습니다. 이번 연습은 “여행 옵션 구성” 명세서 안에 투어 등급·호텔·교통·식사를 적습니다.',11.2)
B.p('이 번호는 명세서, 시퀀스, 파일 이름에서도 똑같이 씁니다. 예: UC-05 → SSD_UC05_저장 → SD_UC05_저장.',11.2)

# 11 - Usecase drawing
B.page('유즈케이스도: 사람과 타원을 이어요','전체 기능을 한눈에 보는 지도입니다.',section='분석 02',sources='메뉴 근거: Use Case Diagram (34쪽). 이 그림은 10쪽의 연습 범위입니다.')
B.steps([
    '01_분석을 선택하고 Model > Add Diagram > <b>Use Case Diagram</b>을 누릅니다. 이름은 UC_전체로 합니다.',
    '<b>Use Case Subject</b>로 큰 상자를 그리고 “CUTY 여행 서비스”라고 씁니다. <b>Actor</b>는 상자 밖에 놓고 “여행자”라고 씁니다.',
    '<b>Use Case</b> 타원 7개를 상자 안에 넣습니다. <b>Association</b>으로 여행자와 각 타원을 잇습니다. 기본 연결선에는 순서 화살표가 필요 없습니다.',
],size=10.9)

def usecases(d):
    d.rect(141,0,358,313,'',fill=PALE,round=0,stroke=BLUE)
    d.txt('CUTY 여행 서비스',155,10,329,12,bold=True)
    d.actor(45,112)
    texts=['UC-01 여행 탐색','UC-02 상품 상세 확인','UC-03 찜 관리',
           'UC-04 여행 옵션 구성','UC-05 여행 구성 저장','UC-06 저장한 여행 조회','UC-07 저장한 여행 수정']
    for i,t in enumerate(texts):
        yy=38+i*38
        d.line([(65,142),(211,yy+15)],width=.6,color=MUTED)
        d.ellipse(211,yy,237,30,t)
B.diagram(317,usecases)
B.box('완료 확인',
      '사람은 상자 밖, 기능은 상자 안에 있나요? 타원 이름은 10쪽과 같나요? '
      '이 선은 “사용한다”는 뜻입니다. 사용 순서는 액티비티도와 시퀀스에서 보여줍니다.',MINT,size=10.6)

# 12 - relationships
B.page('include와 extend는 필요할 때만','점선 화살표도 뜻이 달라요.',section='분석 03',sources='메뉴 근거: Use Case Diagram. 의미 기준: OMG UML 2.5.1 (34쪽).')
B.box('include: 필요한 일을 꺼내어 공통으로 쓰기',
      'A가 B를 포함한다면, A 안에서 B의 동작을 수행합니다. 여러 곳에서 쓰는 묶음 동작을 따로 이름 붙일 때 유용합니다.')

def include(d):
    d.ellipse(10,10,172,50,'여행 구성 저장')
    d.ellipse(322,10,172,50,'구성 유효성 확인')
    d.line([(182,35),(322,35)],dash=True,arrow=True)
    d.txt('&lt;&lt;include&gt;&gt;',183,9,138,10,color=BLUE)
B.diagram(75,include,'방향: 포함하는 기능 → 포함되는 기능. 이 그림은 관계 설명용 추가 예시입니다.')
B.box('extend: 정해 둔 지점에서 조건부로 더하기',
      '기본 기능은 혼자서도 의미가 있어야 합니다. 추가 기능이 붙는 지점과 조건을 명세서에 씁니다. '
      '단순히 “선택 버튼이 있다”는 이유만으로 extend를 쓰지는 않습니다.',MINT)

def extend(d):
    d.ellipse(10,10,172,50,'선물 메시지 추가')
    d.ellipse(322,10,172,50,'선물 주문')
    d.line([(182,35),(322,35)],dash=True,arrow=True)
    d.txt('&lt;&lt;extend&gt;&gt;',183,8,138,10,color=BLUE)
B.diagram(75,extend,'방향: 추가 기능 → 기본 기능. 별도 학습 예시이며 CUTY 요구사항이 아닙니다.')
B.p('Toolbox의 Include 또는 Extend를 고르고 출발 타원에서 도착 타원으로 끕니다. 화살촉이 위 예시 방향인지 확인합니다.',11)
B.box('이번 7개 유즈케이스는 Association만으로 시작해도 돼요',
      '호텔·교통·식사를 순서대로 고른다고 모두 include가 되는 것은 아닙니다. '
      '또 “상세 확인 후 저장한다”는 순서도 유즈케이스도에 화살표로 그리지 않습니다.',AMBER,size=10.7)

# 13 - specification
B.page('명세서: 그림 옆의 약속장','누가, 언제, 무엇을 하고, 실패하면 어떻게 할지 써요.',section='분석 04',sources='작성 위치 근거: Editing Elements · User Interface (34쪽). 항목 구성은 이 책의 연습 양식입니다.')
B.steps([
    'Model Explorer나 그림에서 <b>UC-05 여행 구성 저장</b>을 선택합니다.',
    '오른쪽 <b>Documentation Editor</b>에 아래 항목을 씁니다. 안 보이면 View > Editors를 켭니다.',
    '이름과 번호를 바꿔 UC-01부터 UC-07까지 모두 작성합니다. 과제 양식이 있으면 그 양식에도 옮깁니다.',
],size=11)
B.table(['항목','무엇을 쓰나요?'],[
    ['번호 / 이름','UC-05 / 여행 구성 저장'],
    ['목표 / 액터','이뤄야 할 일 / 그 일을 시작하는 역할'],
    ['사전 조건','시작하기 전에 이미 참이어야 하는 사실'],
    ['시작 신호','누가 무엇을 해서 이 일이 시작되는지'],
    ['기본 흐름','잘 되었을 때의 사용자 행동과 시스템 반응'],
    ['대체 / 예외 흐름','다른 선택 또는 실패가 나오는 단계와 다음 행동'],
    ['성공 후 / 실패 후','끝난 뒤 무엇이 저장되거나 유지되는지'],
    ['규칙 / 미정 사항','금액·저장·권한 규칙과 아직 결정하지 못한 점'],
],[119,CW-119],size=10.5)
B.box('한 단계에 한 가지 행동',
      '“사용자가 저장을 요청한다.” 다음 줄에 “시스템이 선택 내용을 확인한다.”처럼 씁니다. '
      '예외는 “기본 흐름 2단계에서 오류가 나면…”처럼 원래 단계에 연결하세요.',MINT,size=10.7)

# 14 - full spec
B.page('완성 예시: UC-05 여행 구성 저장','나머지 여섯 개도 이 모양으로 쓰면 됩니다.',section='분석 05')
B.table(['항목','UC-05 연습 명세서'],[
    ['목표 / 액터','선택한 여행을 나중에 다시 보기 위해 저장한다. / 여행자'],
    ['사전 조건','상품과 현재 옵션 구성이 열려 있다. 로그인은 이 연습의 조건이 아니다.'],
    ['시작 신호','여행자가 “여행 구성 저장”을 선택한다.'],
    ['기본 흐름','1. 여행자가 현재 구성의 저장을 요청한다.<br/>2. 시스템이 구성 내용을 검사한다.<br/>3. 시스템이 브라우저 저장소에 기록한다.<br/>4. 시스템이 저장 완료와 저장된 구성을 보여준다.'],
    ['E1: 2단계 실패','구성이 유효하지 않으면 수정할 항목을 알린다. 입력은 유지하고 저장하지 않는다.'],
    ['E2: 3단계 실패','저장 공간 부족·접근 제한이면 실패를 알린다. 성공했다고 표시하지 않는다. 현재 입력을 유지한다.'],
    ['성공 후','저장한 여행 목록에서 해당 구성을 다시 열 수 있다.'],
    ['실패 후','새 구성이 저장되었다고 보장하지 않는다. 기존 저장 내용은 유지하는 것으로 설계한다.'],
    ['규칙 / 가정','개인정보·결제 정보는 저장하지 않는다. 금액은 샘플 예상값이다. 기존 구성 갱신과 신규 구성의 구분 규칙은 팀이 정한다.'],
],[110,CW-110],size=10.7)
B.box('사전 조건과 실패를 섞지 않아요',
      '“저장소에 반드시 접근 가능하다”를 사전 조건으로 써 버리면 저장 실패가 빠지기 쉽습니다. '
      '실패할 수 있는 일은 실행 단계와 예외 흐름에서 다룹니다.',AMBER,size=10.7)
B.p('이 명세서의 검증·실패 처리는 연습 설계입니다. 현재 코드가 모든 예외를 구현·검증했다고 뜻하지 않습니다.',10.1,color=MUTED)

# 15 compact specs
B.page('명세서 재료: UC-01부터 UC-03','아래 내용을 13쪽 양식에 옮겨 적어요.',section='분석 06')
for title,body in [
    ('UC-01 여행 탐색',
     '<b>목표·액터:</b> 원하는 상품을 찾는다. / 여행자<br/>'
     '<b>사전·시작:</b> 탐색 화면이 열려 있음. 테마나 검색어를 입력.<br/>'
     '<b>기본:</b> 1. 조건 입력 → 2. 시스템이 상품을 찾음 → 3. 결과 표시.<br/>'
     '<b>다른 길:</b> 결과가 없으면 빈 결과 안내. 조건을 바꾸면 1단계 재실행.<br/>'
     '<b>종료:</b> 조건에 맞는 목록 또는 빈 결과. 저장 데이터 변화 없음.<br/>'
     '<b>규칙:</b> 현재 연습은 샘플 상품 검색. 실시간 추천을 가정하지 않음.'),
    ('UC-02 여행 상품 상세 확인',
     '<b>목표·액터:</b> 상품 정보를 이해한다. / 여행자<br/>'
     '<b>사전·시작:</b> 상품이 표시됨. 한 상품을 선택.<br/>'
     '<b>기본:</b> 1. 상품 선택 → 2. 시스템이 상세 정보·옵션·샘플 안내 표시.<br/>'
     '<b>예외:</b> 상품을 찾지 못하면 안내하고 목록으로 돌아갈 길 제공.<br/>'
     '<b>종료:</b> 상세를 확인하거나 조회 실패를 인지. 저장 변화 없음.<br/>'
     '<b>규칙:</b> 표시 금액·사진은 초안 데이터라는 안내를 유지.'),
    ('UC-03 찜 관리',
     '<b>목표·액터:</b> 관심 상품을 모아 본다. / 여행자<br/>'
     '<b>사전·시작:</b> 상품이 표시됨. 찜 버튼 또는 찜 목록 선택.<br/>'
     '<b>기본:</b> 1. 등록·해제 요청 → 2. 찜 상태 기록 → 3. 변경 상태 표시.<br/>'
     '<b>대체·예외:</b> 목록만 조회 가능. 기록 실패 시 실패 안내·기존 상태 유지.<br/>'
     '<b>종료:</b> 성공 시 찜 상태 저장. 실패 시 저장 완료로 표시하지 않음.<br/>'
     '<b>규칙:</b> 브라우저에만 저장. 회원 계정과의 병합 정책은 미정.'),
]: B.box(title,body,fill=PALE,size=10.5)

# 16 compact specs
B.page('명세서 재료: UC-04, 06, 07','저장 전 구성, 저장 후 조회와 수정을 구분해요.',section='분석 07')
for title,body in [
    ('UC-04 여행 옵션 구성',
     '<b>목표·액터:</b> 내 취향의 조합과 예상 금액을 확인한다. / 여행자<br/>'
     '<b>사전·시작:</b> 상품 상세가 열려 있음. 옵션 구성 시작.<br/>'
     '<b>기본:</b> 1. 네 종류 옵션 선택 → 2. 시스템이 조합 확인·예상 금액 계산 → 3. 요약 표시.<br/>'
     '<b>대체·예외:</b> 다시 선택 가능. 허용되지 않는 조합이면 이유 안내.<br/>'
     '<b>종료:</b> 현재 구성만 바뀜. 영구 저장은 UC-05에서 수행.<br/>'
     '<b>규칙:</b> 조합 허용 여부·실제 요금 규칙은 팀이 확정.'),
    ('UC-06 저장한 여행 조회',
     '<b>목표·액터:</b> 예전에 저장한 구성을 다시 본다. / 여행자<br/>'
     '<b>사전·시작:</b> 앱이 열려 있음. “내 여행”을 선택.<br/>'
     '<b>기본:</b> 1. 목록 요청 → 2. 목록 표시 → 3. 구성 선택 → 4. 옵션·요약 표시.<br/>'
     '<b>대체·예외:</b> 없음은 빈 목록 안내. 읽기 실패는 오류 안내.<br/>'
     '<b>종료:</b> 목록·상세 또는 실패 원인을 확인. 저장 변화 없음.<br/>'
     '<b>규칙:</b> “0개”와 “읽을 수 없음”을 구별.'),
    ('UC-07 저장한 여행 수정',
     '<b>목표·액터:</b> 저장한 구성을 새 선택으로 바꾼다. / 여행자<br/>'
     '<b>사전·시작:</b> 저장한 구성 하나를 열었음. 수정 시작.<br/>'
     '<b>기본:</b> 1. 옵션 변경 → 2. 예상 금액 갱신 → 3. 저장 요청 → 4. 기존 구성 갱신.<br/>'
     '<b>대체·예외:</b> 취소하면 기존 저장 유지. 갱신 실패 시 입력·기존 저장 유지.<br/>'
     '<b>종료:</b> 성공 시 같은 구성의 새 내용 저장. 실패 시 성공 안내 없음.<br/>'
     '<b>규칙:</b> 같은 구성의 식별자를 유지한다는 연습 가정.'),
]: B.box(title,body,fill=MINT,size=10.5)

# 17 activity
B.page('액티비티도: 갈림길을 그려요','UC-05 저장의 기본 흐름과 예외 흐름을 함께 그려요.',section='분석 08',sources='메뉴 근거: Activity Diagram (34쪽). 아래는 14쪽 명세서의 흐름입니다.')
B.steps([
    '01_분석에서 Add Diagram > <b>Activity Diagram</b>을 만듭니다. 이름은 AD_UC05_저장입니다.',
    '<b>Initial, Action, Decision, Merge, Activity Final</b>을 놓고 <b>Control Flow</b>로 잇습니다. 조건은 선의 guard에 “유효함”처럼 쓰면 [유효함]으로 표시됩니다.',
],size=10.7)

def activity(d):
    # One common merge collects exclusive success/failure outcomes before final.
    x=243
    d.dot(x,8)
    d.rect(168,31,150,34,'저장 요청')
    d.line([(x,13),(x,31)],arrow=True)
    d.rect(168,84,150,34,'구성 확인')
    d.line([(x,65),(x,84)],arrow=True)
    d.diamond(x-18,140,36,26)
    d.line([(x,118),(x,140)],arrow=True)
    d.rect(354,136,146,38,'수정 항목 안내',fill=AMBER)
    d.line([(x+18,153),(354,153)],arrow=True)
    d.txt('[유효하지 않음]',275,131,79,9)
    d.rect(168,204,150,36,'구성 저장')
    d.line([(x,166),(x,204)],arrow=True)
    d.txt('[유효함]',247,175,86,9)
    d.diamond(x-18,263,36,26)
    d.line([(x,240),(x,263)],arrow=True)
    d.rect(13,258,147,38,'입력 유지·실패 안내',fill=AMBER)
    d.line([(x-18,276),(160,276)],arrow=True)
    d.txt('[저장 실패]',147,251,94,9)
    d.rect(168,323,150,36,'저장 완료 안내',fill=MINT)
    d.line([(x,289),(x,323)],arrow=True)
    d.txt('[저장 성공]',247,297,98,9)
    d.diamond(x-14,384,28,20)
    d.line([(x,359),(x,384)],arrow=True)
    d.line([(87,296),(87,394),(x-14,394)],arrow=True)
    d.line([(427,174),(427,394),(x+14,394)],arrow=True)
    d.dot(x,427,final=True)
    d.line([(x,404),(x,419)],arrow=True)
B.diagram(436,activity)
B.p('둥근 상자 = 하는 일, 마름모 = 길 나누기/모으기. “예/아니오” 대신 조건을 적으면 정확해집니다. 나중에 담당자를 구분해야 하면 Swimlane을 추가합니다.',10.2,color=MUTED)

# 18 SSD intro
B.page('분석 시퀀스: 시스템과 대화해요','시간은 위에서 아래로 흘러요.',section='분석 09',sources='메뉴 근거: Sequence Diagram (34쪽). SSD는 시스템 시퀀스 다이어그램의 약자입니다.')
B.steps([
    '01_분석에서 Add Diagram > <b>Sequence Diagram</b>을 만듭니다. 이름은 SSD_UC05_저장입니다.',
    '<b>Lifeline</b> 두 개를 놓고 “여행자”, “CUTY 시스템”으로 이름을 붙입니다. 세로 점선은 각 참여자의 시간입니다.',
    '<b>Message</b>로 왼쪽에서 오른쪽으로 저장 요청을 보냅니다. 되돌아오는 결과 선은 messageSort를 <b>reply</b>로 바꿉니다.',
],size=10.6)

def ssd5(d):
    xs=sequence(d,['여행자','CUTY 시스템'],[(0,1,88,'저장 요청(현재 구성)',False)],height=303,boxwidth=117,labelsize=11)
    d.rect(3,116,d.w-6,172,'',fill=WHITE,round=0,stroke=MUTED)
    for xx in xs:
        d.line([(xx,116),(xx,288)],dash=True,color=MUTED,width=.65)
    d.txt('alt',9,120,30,10,bold=True,align=0)
    d.txt('[검사·저장 성공]',67,124,330,10,align=0)
    d.line([(xs[1],163),(xs[0],163)],dash=True,arrow=True)
    d.txt('저장 완료(구성)',80,143,350,11)
    d.line([(3,191),(d.w-3,191)],dash=True,width=.65)
    d.txt('[검사 또는 저장 실패]',67,199,330,10,align=0)
    d.line([(xs[1],251),(xs[0],251)],dash=True,arrow=True)
    d.txt('실패 안내(이유) · 입력 유지',72,227,360,11)
B.diagram(307,ssd5)
B.p('<b>alt 상자:</b> Combined Fragment를 결과 선 둘레에 놓고 interactionOperator를 alt로 바꿉니다. 더블 클릭 > Add Operand로 구역을 늘리고 각 Operand의 guard에 조건을 씁니다.',10.7)
B.box('분석에서는 시스템을 큰 상자 하나로 봐요',
      '이 예시는 사용자에게 보이는 요청과 결과만 그립니다. 저장소·화면·서비스 같은 내부 부품은 27쪽 설계 시퀀스에서 펼쳐 봅니다.',MINT,size=10.6)

# 19 SSD all first four
B.page('분석 시퀀스: 앞의 네 개도 그려요','각 상자는 서로 다른 다이어그램의 내용입니다.',section='분석 10')

def small_ssd(d, title, msgs):
    d.txt(title,0,0,d.w,12,bold=True,align=0)
    sub=Diagram(d.c,d.x,d.t+29,d.w,d.h-29)
    sequence(sub,['여행자','CUTY 시스템'],msgs,height=d.h-29,boxwidth=90,labelsize=9.3)

def four_ssd(d):
    w=(d.w-25)/2
    specs=[
        ('SSD_UC01_탐색',[(0,1,75,'검색(테마, 검색어)',False),(1,0,120,'상품 목록 또는 빈 결과',True)]),
        ('SSD_UC02_상세',[(0,1,75,'상세 요청(상품 ID)',False),(1,0,120,'상세 정보 또는 실패',True)]),
        ('SSD_UC03_찜',[(0,1,75,'찜 변경(상품 ID, 여부)',False),(1,0,120,'변경 결과 또는 실패',True),(0,1,168,'찜 목록 요청',False),(1,0,213,'찜 목록',True)]),
        ('SSD_UC04_구성',[(0,1,75,'옵션 변경(선택값)',False),(1,0,120,'구성·예상 금액 또는 오류',True)]),
    ]
    for i,(title,msg) in enumerate(specs):
        x=(i%2)*(w+25);y=(i//2)*200
        small_ssd(Diagram(d.c,d.x+x,d.t+y,w,180 if i<2 else 251),title,msg)
B.diagram(458,four_ssd)
B.p('UC-03의 찜 목록 조회는 다른 선택 흐름입니다. 제출 그림에는 opt [목록 조회 선택]으로 묶거나 UC-03_조회 그림을 추가하세요. UC-04의 반복 선택은 loop [다시 변경]으로 묶을 수 있습니다.',10.7)
B.box('“유즈케이스별”이면 빠짐없이',
      'UC를 7개로 정했다면 7개 모두 시퀀스를 만듭니다. 정상 흐름을 먼저 그리고, 명세서의 대체·예외는 alt·opt 또는 추가 그림으로 이어 붙입니다.',MINT,size=10.6)

# 20 SSD remaining
B.page('분석 시퀀스: 조회와 수정도 끝내요','UC-05는 18쪽, UC-06과 UC-07은 여기에 있어요.',section='분석 11')

def remaining(d):
    w=(d.w-25)/2
    small_ssd(Diagram(d.c,d.x,d.t,w,283),'SSD_UC06_조회',[
        (0,1,74,'저장 목록 요청',False),(1,0,122,'목록 / 없음 / 읽기 실패',True),
        (0,1,177,'상세 요청(구성 ID)',False),(1,0,231,'저장된 구성 또는 실패',True)])
    small_ssd(Diagram(d.c,d.x+w+25,d.t,w,283),'SSD_UC07_수정',[
        (0,1,74,'옵션 변경(새 선택값)',False),(1,0,122,'새 예상 금액',True),
        (0,1,177,'변경 저장(구성 ID)',False),(1,0,231,'갱신 완료 또는 실패',True)])
B.diagram(285,remaining)
B.label('갈림길을 추가할 위치')
B.table(['그림','추가할 조건'],[
    ['UC-06','목록 결과를 alt [있음] / [없음] / [읽기 실패]로 나눕니다. 상세 요청은 목록에서 하나를 고른 경우에만 보냅니다.'],
    ['UC-07','저장 결과를 alt [갱신 성공] / [갱신 실패]로 나눕니다. 취소는 별도 대체 흐름으로 두고 기존 저장을 유지합니다.'],
],[80,CW-80],size=10.8)
B.box('시퀀스 완성 점검',
      'UC-01~07이 모두 있나요? 요청에 필요한 정보가 적혀 있나요? '
      '사용자에게 돌아오는 결과가 있나요? 성공과 실패가 한 번에 둘 다 실행되는 것처럼 보이지 않나요?',MINT)
B.p('여기 있는 작은 예시는 메시지의 출발점입니다. 제출용에서는 글자와 간격을 충분히 키우고, 15~16쪽의 예외 흐름을 반영하세요.',10.5,color=MUTED)

# 21 packages
B.page('패키지: 비슷한 부품을 한 묶음으로','이 책은 네 묶음으로 나누는 연습 설계를 사용해요.',section='설계 01',sources='메뉴 근거: Package Diagram. 현재 코드 구조와 구분한 교육용 논리 아키텍처입니다.')
B.steps([
    '02_설계에서 Add Diagram > <b>Package Diagram</b>을 만듭니다. 이름은 PKG_전체입니다.',
    '8쪽에서 만든 Package 4개를 Model Explorer에서 끌어옵니다. <b>Dependency</b>는 “도움을 받는 쪽 → 도움을 주는 쪽”으로 긋습니다.',
],size=10.9)

def packages(d):
    d.package(2,10,199,101,'UI','화면 입력·결과 표시')
    d.package(300,10,199,101,'Application','일 처리 순서 조정')
    d.package(300,195,199,101,'Storage','샘플 조회·로컬 저장')
    d.package(2,195,199,101,'Domain','여행 정보·구성 규칙')
    d.line([(201,65),(300,65)],dash=True,arrow=True)
    d.line([(401,111),(401,195)],dash=True,arrow=True)
    d.line([(330,111),(170,195)],dash=True,arrow=True)
    d.line([(300,250),(201,250)],dash=True,arrow=True)
    d.line([(102,111),(102,195)],dash=True,arrow=True)
B.diagram(309,packages)
B.table(['묶음','이번 예시의 책임'],[
    ['UI','여행자의 입력을 받고, 처리 결과를 화면에 보여줌'],
    ['Application','검색·찜·저장 순서를 조정함'],
    ['Domain','Tour, TripPlan 같은 의미 있는 데이터와 규칙'],
    ['Storage','샘플 상품을 읽고, 찜·여행 구성을 로컬에 기록함'],
],[110,CW-110],size=10.6)
B.p('패키지의 화살표는 실행 순서가 아니라 의존 관계입니다. 실제 React 코드에서는 책임이 컴포넌트·훅·함수·타입으로 나뉠 수 있습니다.',10.5,color=MUTED)

# 22 class basics
B.page('클래스: 부품의 이름표를 만들어요','세 칸에 이름, 기억할 것, 할 일을 적어요.',section='설계 02',sources='메뉴 근거: Class Diagram · Formatting Elements (34쪽).')
B.steps([
    'Domain Package를 선택하고 Add Diagram > <b>Class Diagram</b>을 만듭니다. 이름은 CD_Domain입니다.',
    '<b>Class</b> 도형을 놓고 TripPlan이라고 씁니다. 한국어 뜻은 “여행 구성”입니다.',
    '클래스를 선택하고 Model > Add > <b>Attribute</b>로 속성을 추가합니다. 예: id: String',
    'Model > Add > <b>Operation</b>으로 할 일을 추가합니다. 예: validate(): Boolean. 안 보이면 Format > Suppress Attributes / Operations를 해제합니다.',
],size=10.8)

def classintro(d):
    d.klass(14,0,245,'TripPlan',['- id: String','- estimatedPrice: Integer'],['+ validate(): Boolean','+ estimate(): Integer'])
    d.txt('① 부품의 이름',294,9,195,12,bold=True,align=0)
    d.txt('② 기억할 값<br/>id = 구성을 구분하는 번호',294,52,195,11,align=0)
    d.txt('③ 할 수 있는 일<br/>validate = 내용 검사',294,106,195,11,align=0)
B.diagram(162,classintro)
B.table(['기호','뜻'],[
    ['+ / -','밖에서 사용할 수 있음 / 내부에서 사용함'],
    ['이름: 타입','id: String은 “id는 문자열”이라는 뜻'],
    ['메서드(): 반환 타입','estimate(): Integer는 “계산해서 정수를 돌려준다”는 뜻'],
    ['1 / 0..1 / 0..*','정확히 하나 / 없거나 하나 / 없거나 여러 개'],
],[137,CW-137],size=10.5)
B.p('영문 클래스명·메서드명은 뒤의 시퀀스에서도 그대로 씁니다. React 함수를 억지로 Java 클래스처럼 바꿀 필요는 없습니다. 이 책의 클래스는 책임을 설명하는 논리 설계입니다.',10.5,color=MUTED)

# 23 domain
B.page('클래스도 ① Domain','상품과 여행 구성이 어떤 정보를 갖는지 그려요.',section='설계 03')

def domain(d):
    d.klass(5,9,208,'Tour',['+ id: String','+ title: String','+ basePrice: Integer'],[])
    d.klass(292,9,216,'TripPlan',['- id: String','- estimatedPrice: Integer'],['+ validate(): Boolean','+ estimate(): Integer'])
    d.klass(276,248,233,'OptionSelection',['+ tourGrade: String','+ hotel: String','+ transport: String','+ meal: String'],[])
    d.line([(213,85),(292,85)],width=1.1)
    d.txt('1',215,65,22,10)
    d.txt('0..*',258,65,32,10)
    d.line([(392,149),(392,248)],width=1.1)
    # filled diamond on the whole end of composition
    p=d.c.beginPath();p.moveTo(d.x+392,H-d.t-131)
    for xx,yy in [(397,140),(392,149),(387,140)]:p.lineTo(d.x+xx,H-d.t-yy)
    p.close();d.c.setFillColor(INK);d.c.drawPath(p,fill=1,stroke=1)
    d.txt('1',398,153,22,10)
    d.txt('1',398,225,22,10)
    d.txt('구성 1개가 옵션 묶음 1개를 소유',6,274,240,11,align=0)
    d.txt('검은 마름모는 전체 쪽에 놓아요.',6,321,240,10.5,color=MUTED,align=0)
B.diagram(397,domain)
B.p('<b>선 1:</b> TripPlan 하나는 Tour 하나를 참조합니다. Tour 하나는 여러 TripPlan에 사용될 수 있습니다. Association으로 잇고 양 끝의 multiplicity를 설정합니다.',10.8)
B.p('<b>선 2:</b> 이 연습에서는 OptionSelection이 TripPlan에 속하고 다른 구성과 공유되지 않는다고 정합니다. Composition의 검은 마름모는 TripPlan 쪽입니다.',10.8)
B.box('설계 가정 표시',
      '네 옵션은 각 1개씩 고른다고 가정했습니다. 실제 가격 구조·옵션 식별자·허용 조합은 확정 요구사항에 맞춰 바꾸세요. 서버 DTO를 뜻하지 않습니다.',AMBER,size=10.6)

# 24 app
B.page('클래스도 ② Application','“누가 먼저 일할지” 정해 주는 부품이에요.',section='설계 04')
B.p('Application Package에서 Class Diagram을 추가하고 CD_Application으로 이름을 붙입니다. 아래 서비스 세 개를 만듭니다.',11)

def application(d):
    d.klass(5,0,245,'TourService',[],['+ search(criteria): Tour[]','+ getDetail(id): Tour'])
    d.klass(266,0,245,'WishService',[],['+ setWish(tourId, selected): Boolean','+ list(): Tour[]'])
    d.klass(107,130,298,'TripPlanService',[],['+ compose(tour, options): TripPlan','+ save(plan): SaveResult','+ list(): TripPlan[]','+ get(id): TripPlan','+ update(id, options): SaveResult'])
B.diagram(290,application)
B.label('각 서비스가 사용하는 부품')
B.p('TourService → TourCatalog, Tour<br/>WishService → WishRepository, Tour<br/>TripPlanService → TripPlan, TripPlanRepository',10.7)
B.p('의존 대상은 기존 모델을 목록에서 끌어와 옆에 놓고 Dependency로 연결합니다. CD_Application에 외부 패키지의 클래스가 보이는 것은 괜찮습니다. 소유 패키지는 유지합니다.',10.7)
B.box('SaveResult는 결과 묶음',
      '이 연습에서는 성공 여부(ok)와 실패 이유(reason)를 돌려주는 데이터 타입입니다. 새 서비스가 아닙니다. '
      'Domain 안에 DataType으로 ok: Boolean, reason: String을 정의하세요.',MINT,size=10.4)

# 25 UI
B.page('클래스도 ③ UI','사용자의 손과 시스템 사이를 이어 줘요.',section='설계 05')
B.p('UI Package에서 Class Diagram을 추가하고 CD_UI로 이름을 붙입니다. 화면 책임을 맡는 세 부품을 만듭니다.',11)

def ui_class(d):
    d.klass(4,0,241,'TourExplorer',[],['+ onSearch(criteria)','+ showTours(tours)','+ showDetail(tour)'])
    d.klass(268,0,241,'WishPanel',[],['+ onToggleWish(id)','+ showWishes(tours)','+ showError(reason)'])
    d.klass(101,155,310,'TripPlanEditor',['- currentPlan: TripPlan','- state: EditorState'],['+ onSaveRequested()','+ showResult(result)','+ showError(reason)'])
B.diagram(304,ui_class)
B.table(['입력 담당','연결할 서비스'],[
    ['TourExplorer','TourService에 검색·상세 조회 요청'],
    ['WishPanel','WishService에 찜 변경·목록 요청'],
    ['TripPlanEditor','TripPlanService에 구성·저장·수정 요청'],
],[130,CW-130],size=10.5)
B.p('서비스를 목록에서 가져오고 UI → 서비스 방향으로 Dependency를 그립니다. TripPlanEditor는 TripPlan과 EditorState도 참조합니다.',10.7)
B.p('EditorState는 작성중·저장중·저장됨·수정중의 값 목록입니다. Domain에 Enumeration으로 정의하고, 상태 전이는 29쪽에서 설명합니다.',10.5,color=MUTED)

# 26 storage
B.page('클래스도 ④ Storage','읽어 오고, 기록하는 책임을 모아요.',section='설계 06')
B.p('Storage Package에서 Class Diagram을 추가하고 CD_Storage로 이름을 붙입니다. Repository는 “보관 담당”이라는 뜻입니다.',11)

def storage(d):
    d.klass(4,0,241,'TourCatalog',[],['+ search(criteria): Tour[]','+ find(id): Tour'])
    d.klass(268,0,241,'WishRepository',[],['+ set(tourId, selected): Boolean','+ listIds(): String[]'])
    d.klass(106,140,300,'TripPlanRepository',[],['+ save(plan): SaveResult','+ findAll(): TripPlan[]','+ find(id): TripPlan'])
B.diagram(275,storage)
B.box('이번 연습에서는 이렇게 구현할 수 있어요',
      'TourCatalog는 샘플 상품을 읽습니다. WishRepository와 TripPlanRepository는 브라우저 저장소를 사용합니다. '
      '이 클래스들은 설명을 위한 설계이며 현재 코드에 같은 이름으로 존재한다는 뜻은 아닙니다.',PALE)
B.p('저장소의 메서드가 Tour·TripPlan·SaveResult를 사용하므로 해당 Domain 모델을 목록에서 가져와 Dependency로 연결합니다. 이 관계가 21쪽 Storage → Domain에 대응합니다.',10.8)
B.box('API가 확정된 다음',
      '서버 요청은 프로젝트의 api/client.ts와 도메인 API 함수를 통하도록 설계합니다. '
      '컴포넌트가 직접 토큰을 다루지 않게 합니다. DTO와 UI 모델 사이 변환도 별도 책임으로 추가합니다.',MINT,size=10.6)

# 27 design sequence
B.page('설계 시퀀스: 큰 상자를 열어 봐요','UC-05 저장을 실제 책임들로 나누어 봅니다.',section='설계 07',sources='메뉴 근거: Sequence Diagram. 클래스 이름·메서드는 23~26쪽 연습 설계와 연결됩니다.')
B.p('02_설계에서 Sequence Diagram을 만들고 SD_UC05_저장으로 이름을 붙입니다. 클래스는 Model Explorer에서 끌어와 Lifeline으로 만듭니다. 아래는 성공 경로입니다.',10.7)

def design_seq(d):
    names=['여행자','editor:<br/>TripPlanEditor','service:<br/>TripPlanService','plan:<br/>TripPlan','repo:<br/>TripPlanRepository']
    msgs=[(0,1,83,'1. 저장 선택',False),
          (1,2,133,'2. save(plan)',False),
          (2,3,185,'3. validate()',False),
          (3,2,231,'true',True),
          (2,4,278,'4. save(plan)',False),
          (4,2,324,'SaveResult(ok=true)',True),
          (2,1,370,'SaveResult(ok=true)',True),
          (1,0,415,'5. 저장 완료 표시',True)]
    sequence(d,names,msgs,height=440,boxwidth=97,size=8.8,labelsize=8.7)
B.diagram(439,design_seq)
B.steps([
    '객체 이름은 editor, 타입은 TripPlanEditor처럼 연결합니다. Message를 더블 클릭해 <b>Select Operation</b>으로 수신 클래스의 메서드를 선택할 수 있습니다.',
    '제출 그림에는 3번 뒤에 alt [유효] / [무효]를 추가합니다. 무효면 저장소를 호출하지 않고 실패 결과를 돌려줍니다. 유효 경로 안에서도 저장 성공·실패를 나눕니다.',
],size=10.5)
B.p('그림에 새 메서드가 필요해지면 클래스도에도 추가하세요. 마지막 “표시”는 사용자에게 보이는 응답이며 클래스 메서드 호출 이름은 아닙니다.',10.1,color=MUTED)

# 28 communication
B.page('교류도: 연결선에 말 순서를 적어요','통신도라면 Communication Diagram을 고릅니다.',section='설계 08',sources='메뉴 근거: Communication Diagram · Sequence Diagram (34쪽).')
B.steps([
    '02_설계에서 Add Diagram > <b>Communication Diagram</b>을 만듭니다. 이름은 COM_UC05_저장입니다.',
    '같은 클래스들을 Lifeline으로 놓고 <b>Connector</b>로 연결합니다. <b>Forward Message</b> 또는 <b>Reverse Message</b>를 고른 뒤 Connector를 눌러 메시지를 붙입니다.',
    '그림의 showSequenceNumber를 켭니다. 번호를 직접 정할 때는 sequenceNumbering=custom으로 하고, 각 메시지의 sequenceNumber에 1, 1.1, 1.1.1처럼 적습니다.',
],size=10.4)

def communication(d):
    d.rect(7,30,121,53,'여행자',round=0)
    d.rect(194,30,142,53,'editor:<br/>TripPlanEditor',round=0,size=10)
    d.rect(194,151,142,53,'service:<br/>TripPlanService',round=0,size=10)
    d.rect(6,292,168,53,'plan: TripPlan',round=0,size=10)
    d.rect(334,292,174,53,'repo:<br/>TripPlanRepository',round=0,size=9.8)
    d.line([(128,57),(194,57)])
    d.line([(136,48),(184,48)],arrow=True)
    d.txt('1: 저장 선택',110,4,106,9)
    d.line([(266,83),(266,151)])
    d.line([(277,96),(277,140)],arrow=True)
    d.txt('1.1: save(plan)',278,109,195,10,align=0)
    d.line([(221,204),(90,292)])
    d.line([(199,210),(110,270)],arrow=True)
    d.txt('1.1.1: validate()',5,230,179,10)
    d.line([(309,204),(421,292)])
    d.line([(330,210),(407,271)],arrow=True)
    d.txt('1.1.2: [유효] save(plan)',320,228,187,9.6)
B.diagram(353,communication,'27쪽과 같은 저장 시나리오. 읽기 쉽도록 요청 메시지만 표시했습니다.')
B.box('시퀀스와 통신도는 같은 이야기를 다른 모양으로',
      '시퀀스는 시간 순서가 잘 보입니다. 통신도는 누가 누구와 연결되는지 잘 보입니다. '
      '1.1.1은 “1.1을 처리하다가 호출한 일”이라는 뜻입니다. 전체 서비스를 한 장에 모두 넣을 필요는 없습니다.',MINT,size=10.7)

# 29 state
B.page('상태도: 한 대상의 변화를 따라가요','대상은 “여행 구성 편집기” 하나입니다.',section='설계 09',sources='메뉴 근거: Statechart Diagram (34쪽). 아래 상태와 전이는 교육용 설계입니다.')
B.steps([
    '02_설계에서 Add Diagram > <b>Statechart Diagram</b>을 만듭니다. 이름은 SM_여행구성편집기입니다.',
    '<b>Initial State</b>, <b>Simple State</b> 네 개를 놓습니다. <b>Transition</b>으로 연결하고 선을 더블 클릭해 사건 [조건] / 처리 형식으로 씁니다.',
],size=10.6)

def states(d):
    d.dot(20,52)
    d.rect(67,28,128,47,'작성중')
    d.rect(319,28,128,47,'저장중')
    d.rect(319,217,128,47,'저장됨',fill=MINT)
    d.rect(67,217,128,47,'수정중',fill=AMBER)
    d.line([(25,52),(67,52)],arrow=True)
    d.line([(195,43),(319,43)],arrow=True)
    d.txt('저장 요청 [유효]',195,16,124,9.5)
    d.line([(319,65),(195,65)],arrow=True)
    d.txt('저장 실패 [신규]',196,80,122,9.3)
    d.line([(383,75),(383,217)],arrow=True)
    d.txt('저장 성공',388,136,102,10,align=0)
    d.line([(319,239),(195,239)],arrow=True)
    d.txt('옵션 변경',198,215,116,10)
    d.line([(195,252),(319,252)],arrow=True)
    d.txt('수정 취소 / 원본 복구',176,272,164,9.1)
    d.line([(132,217),(132,147),(342,147),(342,75)],arrow=True)
    d.txt('저장 요청 [유효]',142,124,173,9.5)
    d.line([(447,51),(491,51),(491,325),(29,325),(29,240),(67,240)],arrow=True)
    d.txt('저장 실패 [기존 수정] / 입력 유지',113,304,290,9.5)
B.diagram(340,states)
B.p('<b>상태:</b> 작성중, 저장중처럼 “지금 어떤 상황인지”입니다. <b>사건:</b> 저장 요청, 옵션 변경처럼 상태를 바꾸는 계기입니다. “유효하지 않음”이면 원래 상태를 유지하며 오류를 안내하도록 추가합니다.',10.7)
B.box('저장됨은 끝이 아니에요',
      '다시 수정할 수 있으므로 저장됨 뒤에 무조건 Final State를 붙이지 않습니다. '
      '이 그림은 편집기 상태입니다. 여행 예약 상태를 그린다면 별도 대상을 정하고 예약 정책에 맞는 상태도를 새로 만듭니다.',MINT,size=10.7)

# 30 expansion
B.page('과제가 전체 서비스라면 넓혀요','현재 프론트엔드 초안이 과제의 끝은 아닐 수 있어요.',section='확장 01')
B.p('README에는 인증·회원·상품·찜·신청/결제·재고·고객 API 도메인이 소개되어 있습니다. 이는 검토할 기능 후보입니다. 확정 요구사항과 권한을 대조해 유즈케이스를 추가하세요.',11.1)
B.table(['영역 후보','액터 후보','먼저 정할 것'],[
    ['회원가입·로그인·내 정보','비회원 / 회원','누가 어떤 기능을 쓸 수 있는가?'],
    ['여행 신청·취소','회원','신청과 확정은 언제 구분되는가?'],
    ['결제·실패·취소','회원 / 외부 결제 시스템','성공 확인 주체와 실패·환불 규칙은?'],
    ['상품·재고 관리','직원','직원의 권한과 수정 가능한 항목은?'],
    ['고객·등급 관리','직원','조회 범위와 등급 정책은?'],
],[129,132,CW-261],size=10.5)
B.steps([
    '요구사항마다 새 UC 번호를 줍니다. 기존 7개 이름·범위도 필요하면 조정합니다.',
    '새 UC의 명세서를 쓰고 기본·대체·예외 흐름을 확정합니다. 모르는 정책은 “미정”으로 남깁니다.',
    '해당 분석 시퀀스와 필요한 액티비티를 추가합니다. 패키지·클래스·설계 상호작용에도 책임을 배정합니다.',
    '예약처럼 상태가 중요한 대상은 별도 상태도를 만듭니다. 상태와 조건은 명세서에 근거해야 합니다.',
],size=10.8)
B.box('예시는 요구사항을 대신 결정하지 않아요',
      '“결제 성공 = 즉시 예약 확정”이라고 임의로 정하지 않습니다. '
      '또 CUTY 전체가 시스템 경계라면 CUTY 내부 서버·DB를 외부 액터로 놓지 않습니다.',AMBER,size=10.5)

# 31 export
B.page('그림과 명세서를 제출 파일로 만들어요','편집 원본과 읽기용 파일을 둘 다 보관해요.',section='마무리 01',sources='메뉴는 설치된 StarUML 7.1.1에서 확인. Print Dialog / Managing Project / 공식 Export 안내(34쪽).')
B.steps([
    '<b>원본 저장:</b> File > Save로 CUTY_UML_v01.mdj를 저장합니다. PDF만 있으면 모델을 다시 고치기 어렵습니다.',
    '<b>PDF 만들기:</b> File > Print to PDF...를 누릅니다. 처음에는 Current Diagram으로 한 장만 시험합니다.',
    '<b>종이 설정:</b> Page Size는 A4, 가로로 긴 그림은 Landscape를 고릅니다. Show Diagram Name을 켜서 그림 이름을 남깁니다.',
    '<b>전체 그림:</b> 시험 출력이 괜찮으면 All Diagrams로 내보냅니다. 이름 앞 번호를 맞추고 결과 PDF의 실제 순서를 확인합니다.',
    '<b>보고서에 그림 넣기:</b> File > Export Diagram As > PNG... 또는 SVG...를 사용합니다. 모든 그림은 All to PNGs... 같은 항목으로 내보낼 수 있습니다.',
    '<b>명세서도 함께:</b> Documentation 내용은 다이어그램 PDF에 자동으로 전부 실리지 않습니다. 과제 양식에 명세서를 넣거나 File > Export > HTML Docs...로 별도 보관합니다.',
],size=11.1)
B.box('제출 폴더 예시',
      'CUTY_UML_v01.mdj<br/>'
      '01_분석보고서.pdf - 유즈케이스도, 명세서, 분석 시퀀스, 액티비티<br/>'
      '02_설계보고서.pdf - 패키지, 클래스, 설계 상호작용, 상태도<br/>'
      'diagrams/ - 보고서에 넣은 그림 파일',MINT,size=10.7)
B.p('내보낸 파일을 다시 열어 한글, 화살촉, 조건, 선 번호를 확인하세요. 체험판 워터마크가 제출 규칙에 맞는지도 확인합니다.',10.7,color=MUTED)

# 32 QA and matrix
B.page('서로 같은 이야기를 하는지 확인해요','이름과 번호를 따라가면 빠진 그림을 찾을 수 있어요.',section='마무리 02')
B.table(['UC','명세서','분석 시퀀스','담당 설계'],[
    ['01 탐색','UC-01','SSD_UC01_탐색','TourExplorer / TourService'],
    ['02 상세','UC-02','SSD_UC02_상세','TourExplorer / TourService'],
    ['03 찜','UC-03','SSD_UC03_찜','WishPanel / WishService'],
    ['04 구성','UC-04','SSD_UC04_구성','TripPlanEditor / TripPlanService'],
    ['05 저장','UC-05','SSD_UC05_저장','TripPlanService / TripPlanRepository'],
    ['06 조회','UC-06','SSD_UC06_조회','TripPlanService / TripPlanRepository'],
    ['07 수정','UC-07','SSD_UC07_수정','TripPlanEditor / TripPlanService'],
],[65,65,139,CW-269],size=9.9)
B.label('마지막 체크 여덟 가지')
checks=[
    '과제 지시문의 모든 기능과 액터를 다루었나요?',
    '정한 유즈케이스마다 명세서와 분석 시퀀스가 있나요?',
    '기본 흐름뿐 아니라 빈 결과·실패·취소도 연결했나요?',
    '패키지마다 요구된 클래스도를 만들었나요?',
    '설계 메시지의 메서드가 받는 클래스에 실제로 정의되어 있나요?',
    '상태도 대상과 전이 조건이 명세서·클래스도에 맞나요?',
    '성공 경로 예시를 최종 전체 설계로 착각하지 않았나요?',
    '.mdj와 읽기용 파일을 저장하고 다시 열어 보았나요?',
]
for s in checks:
    B.c.setStrokeColor(BLUE);B.c.rect(M+2,H-B.y-13,10,10,fill=0,stroke=1)
    B.y+=put(B.c,s,M+24,B.y-2,CW-24,10.7)+9
B.p('설계 상호작용을 유즈케이스마다 요구받았다면 SD_UC01~07도 모두 만듭니다. 27~28쪽의 저장 예시는 그리는 법을 보여 주는 한 사례입니다.',10.4,color=MUTED)

# 33 troubleshooting
B.page('막히면 이 표부터 봐요','작은 문제는 대부분 선택한 대상에서 시작해요.',section='마무리 03')
B.table(['문제','해 볼 것'],[
    ['메뉴가 회색이에요','먼저 Model Explorer에서 알맞은 Model 또는 Package를 선택합니다.'],
    ['도구 종류가 달라요','지금 연 그림이 Use Case / Sequence / Activity 중 무엇인지 확인합니다.'],
    ['클릭할 때 자꾸 생겨요','Esc를 눌러 선택 모드로 돌아갑니다.'],
    ['명세서 칸이 안 보여요','대상을 선택하고 View > Editors를 켭니다. Documentation Editor를 찾습니다.'],
    ['도형 글자가 잘려요','도형을 넓히고 Format > Word Wrap을 켭니다. PDF에서 다시 확인합니다.'],
    ['메서드가 안 보여요','Format > Suppress Operations가 켜져 있는지 확인합니다.'],
    ['시퀀스 답장 선이 실선이에요','Message를 선택하고 messageSort=reply로 바꿉니다.'],
    ['통신도 순서를 모르겠어요','showSequenceNumber와 각 Message의 sequenceNumber를 확인합니다.'],
    ['지웠는데 목록에는 남아요','Delete는 그림만 지울 수 있습니다. 완전 삭제가 필요할 때만 Delete from Model을 사용합니다.'],
    ['한글이 네모로 보여요','Format > Font에서 한글이 보이는 글꼴로 바꾸고 한 장을 다시 출력합니다.'],
    ['전체 그림이 너무 작아요','한 장에 넣을 내용을 줄여 나누거나 가로 페이지를 사용합니다.'],
],[156,CW-156],size=10.6)
B.box('처음 20분에 할 일',
      '새 파일 저장 → 정리함 만들기 → 여행자 하나와 타원 하나 그리기 → 명세서 4줄 쓰기 → 한 장 PDF로 내보내기. '
      '여기까지 되면 같은 동작을 반복하며 나머지를 만들 수 있습니다.',MINT,size=10.8)

# 34 references
B.page('공식 설명서와 이 책의 기준','메뉴 이름을 더 확인하고 싶을 때 눌러 보세요.',section='참고 자료')
refs=[
    ('설치·라이선스·버전','https://staruml.io/download','https://staruml.io/help','https://staruml.io/changelog/'),
    ('화면·새 파일·요소 편집','https://docs.staruml.io/user-guide/user-interface','https://docs.staruml.io/user-guide/managing-project','https://docs.staruml.io/user-guide/editing-elements'),
    ('그림 관리·글꼴·단축키','https://docs.staruml.io/user-guide/managing-diagrams','https://docs.staruml.io/user-guide/formatting-diagram','https://docs.staruml.io/user-guide/keyboard-shortcuts'),
    ('유즈케이스·시퀀스·통신도','https://docs.staruml.io/working-with-uml-diagrams/use-case-diagram','https://docs.staruml.io/working-with-uml-diagrams/sequence-diagram','https://docs.staruml.io/working-with-uml-diagrams/communication-diagram'),
    ('액티비티·상태도','https://docs.staruml.io/working-with-uml-diagrams/activity-diagram','https://docs.staruml.io/working-with-uml-diagrams/statechart-diagram'),
    ('패키지·클래스','https://docs.staruml.io/working-with-uml-diagrams/package-diagram','https://docs.staruml.io/working-with-uml-diagrams/class-diagram'),
    ('공식 내보내기 안내·UML 표준','https://staruml.io/blog/posts/staruml-2-0-1-release/','https://www.omg.org/spec/UML/2.5.1/About-UML'),
]
for row in refs:
    B.label(row[0])
    for url in row[1:]:
        B.p(f'<link href="{url}" color="#2879C9">{url}</link>',size=8.4,gap=3)
B.y+=6
B.box('이 책을 만든 근거',
      '2026-10-06에 공식 문서와 설치된 StarUML 7.1.1 메뉴 정의를 확인했습니다. '
      'CUTY의 README.md, DESIGN.md, docs/frontend-plan.md를 참고했습니다. '
      'UI 안내와 UML 그림은 직접 작성한 교육용 예시이며, 실제 앱에서 모든 조작을 실행한 검증 화면은 아닙니다. '
      '교수님의 양식·표기·개수 지정이 있으면 그 기준을 우선하세요.',MINT,size=10.2)

B.end()
reader=PdfReader(str(OUT))
assert len(reader.pages)==34, len(reader.pages)
text='\n'.join(p.extract_text() or '' for p in reader.pages)
for term in ['Use Case Diagram','Sequence Diagram','Communication Diagram','Activity Diagram','Statechart Diagram','Class Diagram','Package Diagram','UC-07','명세서','Print to PDF']:
    assert term in text, term
assert len(reader.outline)==34
print(json.dumps({'file':str(OUT),'pages':len(reader.pages),'bytes':OUT.stat().st_size,
                  'bookmarks':len(reader.outline),'chars':len(text),'titles':PAGE_META},ensure_ascii=False,indent=2))
