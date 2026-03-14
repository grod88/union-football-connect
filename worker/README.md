# Union Clips AI - Worker

Backend para geração automatizada de cortes de lives do Union Football.

## Setup

### 1. Pré-requisitos

- Python 3.11+
- FFmpeg instalado (`sudo apt install ffmpeg`)
- yt-dlp instalado (`pip install yt-dlp`)

### 2. Configurar ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas chaves
nano .env
```

### 3. Configurar .env

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Service role key (não anon key!)

# OpenAI (Whisper API)
OPENAI_API_KEY=sk-...

# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Rodar o worker

```bash
./run.sh
```

Ou manualmente:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST /api/clips
Criar novo job de processamento.

```json
{
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "context": "Palmeiras 3x1 Santos - Brasileirão Rod 20"
}
```

### GET /api/clips/{source_id}
Status do job + insights gerados.

### POST /api/clips/{source_id}/produce
Produzir clips aprovados.

```json
{
  "insight_ids": ["uuid1", "uuid2"]
}
```

## Pipeline

```
1. Download (yt-dlp)     → video.mp4 + audio.wav
2. Transcrição (Whisper) → transcript_json + transcript_text
3. Análise (Claude)      → clip_insights[] (draft)
4. Review (Humano)       → approve/reject
5. Produção (FFmpeg)     → produced_clips[] (done)
```

## Custo Estimado

| Serviço | Custo por 2h de vídeo |
|---------|----------------------|
| Whisper API | ~R$3.60 |
| Claude Sonnet | ~R$2-5 |
| **Total** | **~R$6-10** |
