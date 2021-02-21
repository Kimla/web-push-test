<template>
    <app-layout>
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                Dashboard
            </h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <jet-button
                        class="ml-2"
                        :class="{ 'opacity-25': form.processing }"
                        :disabled="form.processing"
                        @click="togglePush"
                    >
                        Enable push notifications
                    </jet-button>
                </div>
            </div>
        </div>
    </app-layout>
</template>

<script>
import AppLayout from '@/Layouts/AppLayout';
import JetButton from '@/Jetstream/Button';

export default {
    components: {
        AppLayout,
        JetButton
    },

    data () {
        return {
            confirmingLogout: false,

            isPushEnabled: false,

            form: this.$inertia.form({
                endpoint: null,
                publicKey: null,
                authToken: null,
                contentEncoding: null
            })
        };
    },

    mounted () {
        this.registerServiceWorker();
    },

    methods: {
        registerServiceWorker () {
            if (!('serviceWorker' in navigator)) {
                console.log('Service workers aren\'t supported in this browser.');
                return;
            }
            navigator.serviceWorker.register('/sw.js')
                .then(() => this.initialiseServiceWorker());
        },
        initialiseServiceWorker () {
            if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
                console.log('Notifications aren\'t supported.');
                return;
            }
            if (Notification.permission === 'denied') {
                console.log('The user has blocked notifications.');
                return;
            }
            if (!('PushManager' in window)) {
                console.log('Push messaging isn\'t supported.');
                return;
            }
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription()
                    .then(subscription => {
                        this.pushButtonDisabled = false;
                        if (!subscription) {
                            return;
                        }
                        this.updateSubscription(subscription);
                        this.isPushEnabled = true;
                    })
                    .catch(e => {
                        console.log('Error during getSubscription()', e);
                    });
            });
        },

        togglePush () {
            if (this.isPushEnabled) {
                this.unsubscribe();
            } else {
                this.subscribe();
            }
        },

        updateSubscription (subscription) {
            const key = subscription.getKey('p256dh');
            const token = subscription.getKey('auth');
            const contentEncoding = (PushManager.supportedContentEncodings || ['aesgcm'])[0];

            this.form.endpoint = subscription.endpoint;
            this.form.publicKey = key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : null;
            this.form.authToken = token ? btoa(String.fromCharCode.apply(null, new Uint8Array(token))) : null;
            this.form.contentEncoding = contentEncoding;

            this.form.post(route('subscriptions'), {
                preserveScroll: true
            });
        },

        unsubscribe () {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    if (!subscription) {
                        this.isPushEnabled = false;
                        this.pushButtonDisabled = false;
                        return;
                    }
                    subscription.unsubscribe().then(() => {
                        this.deleteSubscription(subscription);
                        this.isPushEnabled = false;
                        this.pushButtonDisabled = false;
                    }).catch(e => {
                        console.log('Unsubscription error: ', e);
                        this.pushButtonDisabled = false;
                    });
                }).catch(e => {
                    console.log('Error thrown while unsubscribing.', e);
                });
            });
        },

        subscribe () {
            navigator.serviceWorker.ready.then(registration => {
                const options = { userVisibleOnly: true };
                const vapidPublicKey = window.Laravel.vapidPublicKey;
                if (vapidPublicKey) {
                    options.applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
                }
                registration.pushManager.subscribe(options)
                    .then(subscription => {
                        this.isPushEnabled = true;
                        this.pushButtonDisabled = false;
                        this.updateSubscription(subscription);
                    })
                    .catch(e => {
                        if (Notification.permission === 'denied') {
                            console.log('Permission for Notifications was denied');
                            this.pushButtonDisabled = true;
                        } else {
                            console.log('Unable to subscribe to push.', e);
                            this.pushButtonDisabled = false;
                        }
                    });
            });
        },

        deleteSubscription () {
            console.log('delete');
        },

        urlBase64ToUint8Array (base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }
    }

};
</script>
