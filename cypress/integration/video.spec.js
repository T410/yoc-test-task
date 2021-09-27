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
		cy.get("video").then((elements) => {
			const video = elements[0];
			expect(video.paused).to.equal(true);
		});
	});

	it("shouldn't play when scrolled and the video is not visible", () => {
		cy.get("video").then((elements) => {
			const video = elements[0];
			const viewportHeight = Cypress.config("viewportHeight");

			cy.get("video").scrollIntoView({ offset: { top: -viewportHeight }, duration: 100 });
			expect(video.paused).to.equal(true);
		});
	});

	it("shouldn't play when scrolled and the video is not more than 50% visible", () => {
		cy.get("video").then((elements) => {
			const video = elements[0];
			const { top, height } = video.getBoundingClientRect();
			const viewportHeight = Cypress.config("viewportHeight");

			cy.scrollTo(0, top - viewportHeight + height / 2 - 1, { duration: 100 });
			cy.wait(100).then(() => {
				expect(video.paused).to.equal(true);
			});
		});
	});

	it("should play muted when scrolled and the video is more than 50% visible", () => {
		cy.get("video").then((elements) => {
			const video = elements[0];
			const { top, height } = video.getBoundingClientRect();
			const viewportHeight = Cypress.config("viewportHeight");

			cy.scrollTo(0, top - viewportHeight + height / 2 + 1, { duration: 100 });
			cy.wait(100).then(() => {
				expect(video.paused).to.equal(false);
			});
		});
	});

	it("should play muted when scrolled and the video is 100% visible", () => {
		cy.get("video").then((elements) => {
			const video = elements[0];
			const { height } = video.getBoundingClientRect();
			const viewportHeight = Cypress.config("viewportHeight");

			cy.get("video").scrollIntoView({ offset: { top: -viewportHeight + height }, duration: 100 });
			cy.wait(100).then(() => {
				expect(video.paused).to.equal(false);
			});
		});
	});

	it("shouldn't play when scrolled and the video is top of the screen and it is less than 50% visible", () => {
		cy.get("video").then((elements) => {
			const video = elements[0];
			const { height } = video.getBoundingClientRect();
			cy.get("video").scrollIntoView({ offset: { top: height / 2 + 1 }, duration: 100 });
			const viewportHeight = Cypress.config("viewportHeight");

			cy.wait(100).then(() => {
				const { top, bottom } = video.getBoundingClientRect();
				expect(video.paused).to.equal(true);
			});
		});
	});

	it("shouldn't play when blur/focus happens when the video is not visible", () => {
		cy.document().then((doc) => {
			cy.stub(doc, "visibilityState").value("hidden");
		});
		cy.document().trigger("visibilitychange");

		cy.get("video").then((elements) => {
			const video = elements[0];
			expect(video.paused).to.equal(true);
		});

		cy.document().then((doc) => {
			cy.stub(doc, "visibilityState").value("visible");
		});
		cy.document().trigger("visibilitychange");

		cy.get("video").then((elements) => {
			const video = elements[0];
			expect(video.paused).to.equal(true);
		});
	});

	it("should not exist in DOM after finishes playing and poster image should exist", () => {
		cy.get("video")
			.scrollIntoView({ duration: 100 })
			.then((elements) => {
				const video = elements[0];
				video.currentTime = 29;

				cy.wait(2000);
				cy.get("video").should("not.exist");
				cy.get('[data-testid="poster"]').should("exist");
			});
	});

	it("shouldn't play when blur happens when the video is visible and should continue playing when focus happens", () => {
		cy.get("video")
			.scrollIntoView({ duration: 100 })
			.should("have.prop", "paused", false)
			.and("have.prop", "ended", false);

		cy.wait(100).then(() => {
			cy.document().then((doc) => {
				cy.stub(doc, "visibilityState").value("hidden");
			});
			cy.document().trigger("visibilitychange");

			cy.wait(100).then(() => {
				cy.get("video")
					.scrollIntoView({ duration: 100 })
					.should("have.prop", "paused", true)
					.and("have.prop", "ended", false);
				cy.document().then((doc) => {
					cy.stub(doc, "visibilityState").value("visible");
				});
				cy.document().trigger("visibilitychange");
			});
			cy.wait(100).then(() => {
				cy.get("video")
					.scrollIntoView({ duration: 100 })
					.should("have.prop", "paused", false)
					.and("have.prop", "ended", false);
			});
		});
	});

	it("should mute/unmute when clicking the mute button", () => {
		cy.get("[data-testid=mute]").click();
		cy.get("video").scrollIntoView({ duration: 100 }).should("have.prop", "muted", false);

		cy.get("[data-testid=mute]").click();
		cy.get("video").scrollIntoView({ duration: 100 }).should("have.prop", "muted", true);
	});
});
