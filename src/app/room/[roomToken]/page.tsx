import React from "react";
import RoomCanvas from "@/components/canvas/RoomCanvas";

interface RoomPageProps {
  params: Promise<{
    roomToken: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomToken } = await params;

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#121212]">
      <RoomCanvas roomToken={roomToken} />
    </main>
  );
}
