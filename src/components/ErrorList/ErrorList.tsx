/** Validation errors from a failed calculation. Announced to screen readers when it appears. */
export function ErrorList({ errors }: { errors: string[] }) {
  return (
    <div className="errors" role="alert">
      <p className="errors__title">{errors.length === 1 ? 'Please fix this:' : 'Please fix these:'}</p>
      <ul>
        {errors.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
