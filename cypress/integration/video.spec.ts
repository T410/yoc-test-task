/// <reference types="cypress"/>

/**
 * I couldn't get scrolling working in jest. Apparently jsdom (Jest uses jsdom) is "pretending to be a browser" (https://github.com/jsdom/jsdom#pretending-to-be-a-visual-browser)
 * I researched and I found that I need to use an e2e testing framework. (https://reactjs.org/docs/testing-environments.html#mocking-a-rendering-surface)
 *
 * And I couldn't get Component Testing working in Cypress. I have triead a lot of different things but I got lots of webpack errors.
 * I didn't want to eject and mess with the original structure a lot.
 */

describe("Video play test", { viewportWidth: 375, viewportHeight: 667 }, () => {
	beforeEach(() => {
		cy.visit("http://localhost:3000");
		//Wait so that the page finishes its layout
		cy.wait(1000);
	});

	it("shouldn't autoplay", () => {
		cy.get("video").should("have.prop", "paused", true);
	});

	it("shouldn't play when scrolled and the video is not visible", () => {
		const viewportHeight = Cypress.config("viewportHeight");
		cy.get("video")
			.scrollIntoView({ offset: { top: -viewportHeight, left: 0 }, duration: 100 })
			.should("have.prop", "paused", true);
	});

	it("shouldn't play when scrolled and the video is not more than 50% visible", () => {
		cy.get("video").then((video) => {
			const viewportHeight = Cypress.config("viewportHeight");

			cy.get("video")
				.scrollIntoView({ offset: { top: -viewportHeight + video.height() / 2 - 1, left: 0 }, duration: 100 })
				.should("have.prop", "paused", true);
		});
	});

	it("should play muted when scrolled and the video is more than 50% visible", () => {
		cy.get("video").then((video) => {
			const viewportHeight = Cypress.config("viewportHeight");

			cy.get("video")
				.scrollIntoView({ offset: { top: -viewportHeight + video.height() / 2, left: 0 }, duration: 100 })
				.should("have.prop", "paused", false);
		});
	});

	it("should play muted when scrolled and the video is 100% visible", () => {
		cy.get("video").then((video) => {
			const viewportHeight = Cypress.config("viewportHeight");

			cy.get("video")
				.scrollIntoView({ offset: { top: -viewportHeight + video.height(), left: 0 }, duration: 100 })
				.should("have.prop", "paused", false);
		});
	});

	it("shouldn't play when scrolled and the video is top of the screen and it is less than 50% visible", () => {
		cy.get("video").then((video) => {
			cy.get("video")
				.scrollIntoView({ offset: { top: video.height() / 2 + 1, left: 0 }, duration: 100 })
				.should("have.prop", "paused", true);
		});
	});

	it("shouldn't play when blur/focus happens when the video is not visible", () => {
		//Triggering visibilitychange event and stubbing visibilityState to hidden (Blur)
		cy.document().then((doc) => {
			cy.stub(doc, "visibilityState").value("hidden");
		});
		cy.document().trigger("visibilitychange");

		cy.get("video").should("have.prop", "paused", true);

		//Triggering visibilitychange event and stubbing visibilityState to visible (Focus)
		cy.document().then((doc) => {
			cy.stub(doc, "visibilityState").value("visible");
		});
		cy.document().trigger("visibilitychange");

		cy.get("video").should("have.prop", "paused", true);
	});

	it("shouldn't play when blur happens and when the video is visible, should continue playing when focus happens", () => {
		//Scroll into video, it should be playing and not ended
		cy.get("video")
			.scrollIntoView({ duration: 100 })
			.should("have.prop", "paused", false)
			.and("have.prop", "ended", false);

		//Task away from the page that contains the video (Blur)
		cy.document().then((doc) => {
			cy.stub(doc, "visibilityState").value("hidden");
		});
		cy.document().trigger("visibilitychange");

		//The video shouldn't be playing and ended
		cy.get("video")
			.scrollIntoView({ duration: 100 })
			.should("have.prop", "paused", true)
			.and("have.prop", "ended", false);

		//Go to the page again (Focus)
		cy.document().then((doc) => {
			cy.stub(doc, "visibilityState").value("visible");
		});
		cy.document().trigger("visibilitychange");

		//The video should be playing and not ended
		cy.get("video")
			.scrollIntoView({ duration: 100 })
			.should("have.prop", "paused", false)
			.and("have.prop", "ended", false);
	});

	it("should not exist in DOM after finishes playing and poster image should exist", () => {
		cy.get("video")
			.scrollIntoView({ duration: 100 })
			.then((video) => {
				video.prop("currentTime", 29);

				cy.wait(2000);
				cy.get("video").should("not.exist");
				cy.get('[data-testid="poster"]').should("exist");
			});
	});

	it("should mute/unmute when clicking the mute button", () => {
		cy.get("[data-testid=mute]").click();
		cy.get("video").scrollIntoView({ duration: 100 }).should("have.prop", "muted", false);

		cy.get("[data-testid=mute]").click();
		cy.get("video").scrollIntoView({ duration: 100 }).should("have.prop", "muted", true);
	});
});
