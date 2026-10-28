export function ProjectBoardLoading() {
  return (
    <main className="home-shell" id="main-content" aria-busy="true">
      <section className="hero" aria-labelledby="project-loading-title">
        <p className="eyebrow">Forma Workspace</p>
        <h1 id="project-loading-title">Loading project board</h1>
        <p className="hero-copy" role="status" aria-live="polite">
          Loading the latest workspace, project, members, and tasks.
        </p>
      </section>
    </main>
  )
}
