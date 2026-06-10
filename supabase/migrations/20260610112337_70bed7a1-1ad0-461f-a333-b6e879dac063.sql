
-- ai_models
CREATE TABLE public.ai_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  provider text NOT NULL DEFAULT 'custom',
  endpoint text,
  model_identifier text,
  api_key_secret_name text,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_models TO authenticated;
GRANT ALL ON public.ai_models TO service_role;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai_models" ON public.ai_models FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER ai_models_updated_at BEFORE UPDATE ON public.ai_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- diseases
CREATE TABLE public.diseases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  severity text NOT NULL DEFAULT 'moderate',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.diseases TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.diseases TO authenticated;
GRANT ALL ON public.diseases TO service_role;
ALTER TABLE public.diseases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view diseases" ON public.diseases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage diseases" ON public.diseases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER diseases_updated_at BEFORE UPDATE ON public.diseases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- system_settings
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage system_settings" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- seed defaults
INSERT INTO public.diseases (name, description, severity) VALUES
  ('Pneumonia', 'Lung infection causing inflammation of air sacs', 'high'),
  ('Normal', 'No abnormality detected', 'none'),
  ('Tuberculosis', 'Bacterial infection mainly affecting the lungs', 'high'),
  ('COVID-19', 'Coronavirus respiratory illness', 'high')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ai_models (name, provider, model_identifier, is_active, is_default, notes) VALUES
  ('Lovable AI - Gemini Flash', 'lovable', 'google/gemini-2.5-flash', true, true, 'Default vision model via Lovable AI Gateway')
ON CONFLICT DO NOTHING;

-- Allow admins to update/delete user role assignments + analyses
CREATE POLICY "Admins manage user_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete analyses" ON public.analyses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
