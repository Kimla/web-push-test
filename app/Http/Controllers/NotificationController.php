<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Notifications\Test;
use App\Models\User;

class NotificationController extends Controller
{
    public function test() {
        $user = User::find(1);
                
        $user->notify(new Test());
    }

    public function subscriptions(Request $request) {
        $request->user()->updatePushSubscription(
            $request->endpoint,
            $request->publicKey,
            $request->authToken,
            $request->contentEncoding
        );

        return back();
    }
}
