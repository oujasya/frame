# FRAME design decisions

Greenfield movie discovery product for people who collect and discuss films. Approved direction: charcoal (#121313), warm white (#f2eee7), vermilion (#f96849), muted gray (#aaa9a2). Manrope, regular/semibold/bold, locally bundled. Spacing primarily 8/16/24/32/48/64px; restrained 4px card/control radii. Editorial headline, cinematic still, then poster collections. Dense film grids alternate with a quiet typographic statement. No invented testimonials, user counts or star ratings.

Design dials: visual variance 6/10, motion 2/10, density 6/10, asset dependence 8/10, existing-brand fidelity 1/10 (new FRAME identity, not a Letterboxd reproduction). Narrative: discover a film, inspect it, save it. Viewing: phone through desktop. Temperature: intimate and cinematic. One large headline and six posters fit a desktop view; grids collapse to three and two columns as space tightens.

Simple CSS poster hover provides feedback, 200ms transform with cubic-bezier(.23,1,.32,1), fine pointers only. Reduced-motion users get immediate states. Native scrolling and native dialog focus management; no decorative WebGL or scroll hijacking.

## Supplied files used

- Web Design Engineer: art direction and two user-approved checkpoints, clear hierarchy, native controls, recoverable states. Missing referenced recipe/calibration files; not treated as available. Requested Vite modules take precedence over its inline-Babel prototype instructions.
- Better Layout: consistent edges, related controls grouped together, logical properties, natural wrapping and responsive grids.
- Animate: cheap purposeful CSS feedback, specific properties, reduced motion and hover gating.
- Awwwards guidance: strong focal imagery, honest provenance, cropped aspect ratios, fallback art, no invented social proof. Its mandatory GSAP/smooth-scroll approach conflicts with Animate's cheapest-tool guidance and the approved subtle motion system; native scrolling and CSS win for this browsing app.
- Landing Page Design: Manrope, scale-based type, clear calls to action, focus/loading/empty/error states. This is a discovery homepage, so no invented commercial offer, FAQs, guarantees or sales funnel.
- Interface Review: source inspection and explicit coverage limits. Only Better Layout is present; better-accessibility, better-writing, better-typography, better-colors and better-ui are **Not reviewed under their missing skill definitions**.
- Visual Critique: check grouping, balance, whitespace and consistent poster rhythm. Rendered visual judgments remain unverified while local browser connectivity is blocked.
- Tastemaker: committed single identity and honest content. Its local knowledge bases are absent, so no CR/TS IDs or formal scores are claimed.
- Emil Design Engineering: descriptor reviewed, but mandatory detailed guide is absent. Full skill execution is unavailable.
- The five `skills 2` files describe the unrelated VANTA glasses store. Applied their useful reference principles: editorial cinema, purposeful crops, live source-of-truth data, motion restraint and responsive controls. Did not import VANTA, WooCommerce requirements or reference-only eyewear assets.

FRAME wordmark is typeset original text. Artwork comes from TMDB image URLs; no proprietary VANTA imagery is bundled. Solar icons use Iconify. No avatars or invented endorsements.

Image connectivity fix: TMDB image requests time out here. Sample mode now displays cinema photography from images.unsplash.com, with explicit MOOD IMAGE badges; live mode attempts TMDB art first. Remote mood-image sources returned HTTP 200 in header checks. The standalone preview and original draft entry both include this fix. No mood photo is represented as an authentic film still or poster.

## Verification boundary

Production build and all three backend integration tests passed. Source checks cover normal/loading/empty/error conditions, labels, native form/dialog behavior, focus indicators, reduced-motion CSS and responsive rules. Browser rendering, 320px clipping, 200% zoom, keyboard focus restoration, and actual interaction feel cannot be marked passed until a reachable preview is inspected. Loopback addresses timed out, and automated file-preview inspection was explicitly denied by browser security policy; no browser-policy workaround was attempted. Public launch remains a Day 5 task.
