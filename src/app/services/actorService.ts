import { IActor, IActorCreate } from '../types/actor';

class ActorService {
  private baseUrl = '/actors';

  async createActor(actor: IActorCreate): Promise<IActor> {
    try {
      console.log('Відправляємо дані:', actor);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(actor)
      });

      const responseText = await response.text();
      console.log('Відповідь сервера:', responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error('Помилка парсингу JSON:', e);
        throw new Error('Неочікувана відповідь сервера');
      }

      if (!response.ok) {
        if (data && data.message) {
          throw new Error(data.message);
        }
        if (response.status === 422 && data && data.errors) {
          const validationErrors = Object.values(data.errors).flat().join(', ');
          throw new Error(`Помилка валідації: ${validationErrors}`);
        }
        throw new Error('Помилка при додаванні актора');
      }

      return data;
    } catch (error) {
      console.error('Деталі помилки:', error);
      throw error instanceof Error 
        ? error 
        : new Error('Невідома помилка при додаванні актора');
    }
  }

  async getActors(): Promise<IActor[]> {
    const response = await fetch(this.baseUrl);
    return await response.json();
  }

  async getActorById(id: number): Promise<IActor> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    return await response.json();
  }

}

export const actorService = new ActorService();