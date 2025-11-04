export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="text-center">
        <div className="relative mx-auto h-12 w-12 animate-pulse">
          <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
        </div>
        <p className="mt-6 text-sm text-zinc-400">Carregando...</p>
      </div>
    </div>
  )
}
