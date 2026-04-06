import { createClient } from '@/lib/supabase/client';

export const createDiagramFromRoom = async (
  userId: string,
  title: string,
  elements: any[],
  appState: any
) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('diagrams')
    .insert([
      {
        user_id: userId,
        title: title || 'Untitled Diagram',
        elements,
        app_state: {
          theme: appState.theme || 'dark',
          viewBackgroundColor: appState.viewBackgroundColor,
        },
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const toggleDiagramSharing = async (
  diagramId: string,
  userId: string,
  enable: boolean
) => {
  const supabase = createClient();
  const shareToken = enable ? crypto.randomUUID() : null;

  const { data, error } = await supabase
    .from('diagrams')
    .update({ share_token: shareToken })
    .eq('id', diagramId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
