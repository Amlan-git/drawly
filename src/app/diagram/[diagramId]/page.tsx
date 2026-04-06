import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import DiagramCanvas from '@/components/canvas/DiagramCanvas';

interface DiagramPageProps {
  params: Promise<{
    diagramId: string;
  }>;
}

export default async function DiagramPage({ params }: DiagramPageProps) {
  const { diagramId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  const { data: diagram, error } = await supabase
    .from('diagrams')
    .select('*')
    .eq('id', diagramId)
    .single();

  if (error || !diagram) {
    console.error('Error fetching diagram:', error?.message);
    notFound();
  }

  // Redirect unauthorized private views
  if (diagram.user_id !== user.id) {
    if (!diagram.share_token) {
      redirect('/dashboard');
    }
  }

  const initialData = {
    elements: diagram.elements || [],
    appState: diagram.app_state || {},
    title: diagram.title || 'Untitled Diagram',
    share_token: diagram.share_token,
  };

  return <DiagramCanvas diagramId={diagramId} initialData={initialData} />;
}
