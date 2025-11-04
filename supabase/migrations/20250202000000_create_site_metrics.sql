-- Create site_metrics table for tracking various site interactions
CREATE TABLE IF NOT EXISTS site_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL, -- 'calculadora_taxas', 'whatsapp_click', etc
  visitor_id text,
  metadata jsonb DEFAULT '{}', -- Additional data like product_id, etc
  created_at timestamptz DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_site_metrics_type ON site_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_site_metrics_created_at ON site_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_site_metrics_visitor_id ON site_metrics(visitor_id);

-- Create materialized view for aggregated metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS site_metrics_stats AS
SELECT 
  metric_type,
  COUNT(*) as total_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  DATE_TRUNC('day', created_at) as day
FROM site_metrics
GROUP BY metric_type, DATE_TRUNC('day', created_at);

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_site_metrics_stats_type ON site_metrics_stats(metric_type);
CREATE INDEX IF NOT EXISTS idx_site_metrics_stats_day ON site_metrics_stats(day);

-- Function to refresh stats
CREATE OR REPLACE FUNCTION refresh_site_metrics_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY site_metrics_stats;
END;
$$;

-- Enable RLS
ALTER TABLE site_metrics ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (for tracking)
CREATE POLICY "Allow insert for tracking" ON site_metrics
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to read (admins only have access to admin routes)
CREATE POLICY "Allow authenticated read" ON site_metrics
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete (admins only)
CREATE POLICY "Allow authenticated delete" ON site_metrics
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT, INSERT ON site_metrics TO anon, authenticated;
GRANT DELETE ON site_metrics TO authenticated;
