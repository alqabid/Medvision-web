-- Add imaging modality ('xray' | 'ct') to analyses table, defaulting to 'xray' for backward compatibility.
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS modality TEXT NOT NULL DEFAULT 'xray'
  CHECK (modality IN ('xray', 'ct'));

CREATE INDEX IF NOT EXISTS idx_analyses_modality ON public.analyses (modality);
