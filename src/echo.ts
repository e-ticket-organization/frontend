import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;

    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: process.env.NEXT_PUBLIC_PUSHER_KEY,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        forceTLS: true,
        wsHost: window.location.hostname,
        wsPort: 6001,
        wssPort: 6001,
        disableStats: true,
        encrypted: true,
    });
} 