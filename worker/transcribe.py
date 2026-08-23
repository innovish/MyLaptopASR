"""Local FunASR worker. The model is downloaded to the local Hugging Face cache on first run."""
import json
import os
import sys

from funasr import AutoModel

model = AutoModel(
    model=os.getenv("FUNASR_MODEL", "paraformer-zh"),
    vad_model=os.getenv("FUNASR_VAD_MODEL", "fsmn-vad"),
    punc_model=os.getenv("FUNASR_PUNC_MODEL", "ct-punc"),
    device=os.getenv("FUNASR_DEVICE", "cpu"),
    disable_update=True,
)

result = model.generate(input=sys.argv[1], batch_size_s=300, sentence_timestamp=True)
item = result[0] if isinstance(result, list) else result
raw = item.get("sentence_info") or item.get("timestamp") or []
segments = []
for sentence in raw:
    if "text" not in sentence:
        continue
    start = sentence.get("start", 0)
    end = sentence.get("end", start)
    # FunASR timestamps are milliseconds for sentence_info.
    if start > 1000 or end > 1000:
        start, end = start / 1000, end / 1000
    segments.append({"start": float(start), "end": float(end), "text": sentence["text"].strip()})
if not segments and item.get("text"):
    segments = [{"start": 0, "end": 0, "text": item["text"].strip()}]
print("__ASR_RESULT__" + json.dumps({"segments": segments}, ensure_ascii=False))
