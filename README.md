# YOC Test Task - Video Adunit

## Commands

Standard react-script command plus `npm run test-e2e`

## Notes

### Tested Device

Device `iPhone 8 (iOS 15.0)`

Browser `Safari`

### Engagements

- BLUR
- FOCUS
- VIDEO_LOAD_START
- VIDEO_CAN_PLAY
- VIDEO_MUTE
- VIDEO_UNMUTE
- VIDEO_PLAY
- VIDEO_FIRST_QUARTILE
- VIDEO_HALF
- VIDEO_THIRD_QUARTILE
- VIDEO_FINISH
- VIDEO_PAUSE
- VIDEO_VIEWED

Keeping track of user engagements is the core concept of monetization. So I tried my best to add as many meaningful engagements as possible without diving too deep into it.

### Test

I have tried so hard on firing/simulating UI events using `testing library`. However it seemed that `jsdom` is just pretending to be a browser. Then I found that I need to use a framework for e2e testing. React docs advices developers to use Cypress/puppeteer.[https://reactjs.org/docs/testing-environments.html#mocking-a-rendering-surface]

I decided to use Cypress since it seemed easier. But I had issues with it when it comes to React Component testing. Testing the DOM environment is fine but I couldn't test the Component states/hooks etc. I had webpack issues, dependency errors, not finding file on my system issues... And I didn't want to eject react scripts. Because of that I couldn't test the engagements.

Than I thought "I could somehow simulate/mock video play states using testing-library". But since it uses jsdom, I had no luck with that.

I know that with `enzyme` you can test the Component states, hooks, etc. But enzyme only supports React up to version 16. Yes there are "unofficial" enzyme packages that supports 17 but I didn't want to risk wasting several hours trying to fix a package that has potential issues. And also I didn't want to downgrade React to use enzyme.

Now that I'm thinking, if engagement function also sets attributes of the video element, like `<video engage-first-quartile></video>`, it can be tested pretty easily.

Well, if I had, let's say, a week maybe I could have definitely write tests that cover engagements.

### Thoughts

I learned a lot during this task. I knew how to test simple functions and simple things but when it comes to e2e or integration testing, I didn't have enough knowledge. I researched and learned lot of things about testing. And besides I always wanted to dive deep into it.

In my current team, we don't write tests, which is unfortunate.
