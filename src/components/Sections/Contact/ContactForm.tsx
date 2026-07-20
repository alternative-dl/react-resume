import {FC, memo, useCallback, useMemo, useState} from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

const ContactForm: FC = memo(() => {
  const defaultData = useMemo(
    () => ({
      name: '',
      email: '',
      message: '',
    }),
    [],
  );

  const [data, setData] = useState<FormData>(defaultData);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const onChange = useCallback(
    <T extends HTMLInputElement | HTMLTextAreaElement>(event: React.ChangeEvent<T>): void => {
      const {name, value} = event.target;

      const fieldData: Partial<FormData> = {[name]: value};

      setData({...data, ...fieldData});
    },
    [data],
  );

  const handleSendMessage = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsSending(true);

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          setMessage('Your message has been sent successfully!');
        } else {
          setMessage('Failed to send your message1.');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessage('Failed to send your message2.');
      } finally {
        setIsSending(false);
      }
    },
    [data],
  );

  const inputClasses =
    'border-[3px] border-ink bg-paper rounded-none px-3 py-2 font-mono text-sm text-ink placeholder:text-neutral-500 placeholder:text-sm focus:outline-none focus:shadow-brutal-sm focus:ring-0';

  return (
    <form className="grid min-h-[320px] grid-cols-1 gap-y-4" method="POST" onSubmit={handleSendMessage}>
      <input className={inputClasses} name="name" onChange={onChange} placeholder="Name" required type="text" />
      <input
        autoComplete="email"
        className={inputClasses}
        name="email"
        onChange={onChange}
        placeholder="Email"
        required
        type="email"
      />
      <textarea
        className={inputClasses}
        maxLength={250}
        name="message"
        onChange={onChange}
        placeholder="Message"
        required
        rows={6}
      />
      <button
        aria-label="Submit contact form"
        className="w-max border-[3px] border-ink bg-ink px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-tight text-signal shadow-brutal-sm outline-none transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
        disabled={isSending}
        type="submit">
        {isSending ? 'Sending...' : 'Send Message'}
      </button>
      {message && (
        <p className="border-[3px] border-ink bg-paper px-3 py-2 font-mono text-sm font-bold text-ink">{message}</p>
      )}
    </form>
  );
});

ContactForm.displayName = 'ContactForm';
export default ContactForm;
