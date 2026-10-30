interface ProjectBoardPersistenceAlertProps {
  onDismiss: () => void
}

export function ProjectBoardPersistenceAlert({
  onDismiss,
}: ProjectBoardPersistenceAlertProps) {
  return (
    <div className="persistence-alert" role="alert">
      <div>
        <strong>Task changes could not be saved.</strong>
        <p>Your latest changes may be lost after you refresh this page.</p>
      </div>
      <button className="button-secondary" type="button" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
}
