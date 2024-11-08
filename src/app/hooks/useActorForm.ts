import { useState } from 'react';
import { IActorCreate } from '../types/actor';
import { actorService } from '../services/actorService';
import { useRouter } from 'next/navigation';

export const useActorForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [actor, setActor] = useState<IActorCreate>({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    passport: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setActor(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await actorService.createActor(actor);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сталася помилка при додаванні актора');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    actor,
    isLoading,
    error,
    handleChange,
    handleSubmit
  };
};