# pogo-tracker

Given your coordinates, this program will query the internal Niantic Campfire
API for nearby raids and tell you if any 4, 5, or 6 star raid eggs are hatching
within the next 5 minutes. This is useful for getting a jump on hosting raids on
PokeGenie, where having a long amount of time to wait in queue before the raid
expires is an advantage.

The idea is to integrate this API into an iOS automation that will run every `n`
minutes and send the device location with the native `Get Current Location`
action, then parse the response and send a notification if any raids are
hatching soon.

Unfortunately, iOS automations do not have a built-in interval trigger, so you
will need to get creative. The two most popular workarounds are by using a timer
(one shortcut creates an `n`-minute timer, and an automation uses the timer's
completion as a trigger; then the automation restarts the timer) or by using
focus mode (one shortcut sets a focus mode for `n` minutes, and an automation
uses the focus mode's deactivation as a trigger; then the automation reactivates
the focus mode).

Neither method is perfect, but the focus mode method doesn't run the risk of
alarms sounding every `n` minutes, so I recommend the focus mode setup.

1. In your settings, create a focus mode called "Raid Tracking" (or whatever you want).
2. Create a shortcut called "Start Raid Tracking" that sets the focus mode to
   "Raid Tracking" for `n` minutes.
   
   <img src="https://i.imgur.com/IJhKJmB.png" alt="Start Raid Tracking" max-height="400" width="300" />

3. Create a shortcut called "Check for Raids" that queries the `pogo-tracker` API with your
   coordinates and sends a notification if any raids are hatching soon. At the
   moment, I am making `https://pogo.jsiegel.dev` available for public use as a
   hosted instance of this API. Hopefully it's not abused.
   
   <img src="https://i.imgur.com/Zfb23MB.png" alt="Check for Raids" max-height="400" width="300" />

4. Create an automation triggered by "Time of Day" that runs "Start Raid
   Tracking" every day at 6AM (or whatever time you want to start tracking
   raids).
   
   <img src="https://i.imgur.com/JLmGWJZ.png" alt="Start Raid Tracking Automation" max-height="400" width="300" />

5. Create an automation triggered by "When Raid Tracking is Turned Off". If it
   is before 9:59PM, run "Check for Raids" and then "Start Raid Tracking".
   Otherwise, do nothing (so Raid Tracking turns off when eggs stop hatching for
   the day).
   
   <img src="https://i.imgur.com/JCk55mv.png" alt="Check for Raids Automation" max-height="400" width="300" />
   <img src="https://i.imgur.com/0QBDttL.png" alt="Check for Raids Automation
   Internal" max-height="400" width="300" />

To install:

```bash
bun install
```

To configure, create an `.env` file in the root of the project with the following contents:

```bash
PORT=3000
```

To start:

```bash
bun start
```
