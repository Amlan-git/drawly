import React from "react";
import RoomCanvas from "@/components/canvas/RoomCanvas";
import AppHeader from "@/components/shell/AppHeader";

interface RoomPageProps {
  params: Promise<{
    roomToken: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomToken } = await params;

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#121212]">
      {/* Shell overlay */}
      <AppHeader roomToken={roomToken} />
      
      {/* Canvas */}
      <RoomCanvas roomToken={roomToken} />
    </main>
  );
}
