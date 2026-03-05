import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { AppEvent, AppEventPayload } from './event-types';

type ListenerFn<E extends AppEvent> = (payload: AppEventPayload[E]) => void | Promise<void>;

@Injectable()
export class EventDispatcher {
    private emitter = new EventEmitter();

    constructor() {
        // Allow many listeners (one per listener service)
        this.emitter.setMaxListeners(50);
    }

    /**
     * Emit an event. Listeners are called asynchronously (fire-and-forget).
     */
    emit<E extends AppEvent>(event: E, payload: AppEventPayload[E]): void {
        console.log(`[EventDispatcher] Emitting: ${event}`);
        this.emitter.emit(event, payload);
    }

    /**
     * Register a listener for an event.
     */
    on<E extends AppEvent>(event: E, listener: ListenerFn<E>): void {
        this.emitter.on(event, async (payload: AppEventPayload[E]) => {
            try {
                await listener(payload);
            } catch (err) {
                console.error(`[EventDispatcher] Error in listener for ${event}:`, err);
            }
        });
    }

    /**
     * Register a one-time listener.
     */
    once<E extends AppEvent>(event: E, listener: ListenerFn<E>): void {
        this.emitter.once(event, async (payload: AppEventPayload[E]) => {
            try {
                await listener(payload);
            } catch (err) {
                console.error(`[EventDispatcher] Error in one-time listener for ${event}:`, err);
            }
        });
    }

    /**
     * Remove all listeners for a given event.
     */
    removeAllListeners(event?: AppEvent): void {
        if (event) {
            this.emitter.removeAllListeners(event);
        } else {
            this.emitter.removeAllListeners();
        }
    }
}
