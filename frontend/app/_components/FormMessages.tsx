// Renders backend/validation error messages near the top of a form.
export function FormMessages({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return (
    <div className="form-messages" role="alert">
      {messages.length === 1 ? (
        <p>{messages[0]}</p>
      ) : (
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
