const apiKey = 'jT4y7YyhceYnYstZwk7b4gGJbRjTSdbPOIjG7pmY';
const apodUrl = 'https://api.nasa.gov/planetary/apod';

// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.querySelector('.filters button');
const modal = document.getElementById('photoModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalCloseButton = document.getElementById('modalCloseButton');
const spaceFactText = document.getElementById('spaceFactText');

const spaceFacts = [
	'One day on Venus is longer than one year on Venus.',
	'Neutron stars can spin around 700 times per second.',
	'Some planets may rain diamonds under the right conditions.',
	'The observable universe is about 93 billion light-years across.',
	'Jupiter is so large that more than 1,300 Earths could fit inside it.',
	"The Sun contains more than 99 percent of the solar system's mass.",
	'Mars has the largest volcano in the solar system, Olympus Mons.',
	'Space is completely silent because there is no air to carry sound.',
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function showRandomSpaceFact() {
	const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
	spaceFactText.textContent = randomFact;
}

function formatDate(dateString) {
	const date = new Date(dateString + 'T00:00:00');
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

function showLoadingMessage() {
	gallery.innerHTML = `
		<div class="status-message">
			<div class="status-icon">🔄</div>
			<p>Loading space photos...</p>
		</div>
	`;
}

function showEmptyMessage(message) {
	gallery.innerHTML = `
		<div class="status-message">
			<div class="status-icon">🛰️</div>
			<p>${message}</p>
		</div>
	`;
}

function createGalleryItem(photo) {
	const item = document.createElement('article');
	item.className = 'gallery-item';

	if (photo.media_type === 'video') {
		const videoPreview = createVideoPreview(photo);

		item.innerHTML = `
			<a class="gallery-card gallery-card--video" href="${photo.url}" target="_blank" rel="noreferrer">
				${videoPreview}
				<div class="gallery-copy">
					<h2>${photo.title}</h2>
					<p>${formatDate(photo.date)}</p>
					<p class="media-note">Video entry. Click to open the video.</p>
				</div>
			</a>
		`;
		return item;
	}

	item.innerHTML = `
		<button class="gallery-button" type="button" aria-label="Open ${photo.title}">
			<img src="${photo.url}" alt="${photo.title}" />
			<div class="gallery-copy">
				<h2>${photo.title}</h2>
				<p>${formatDate(photo.date)}</p>
			</div>
		</button>
	`;

	item.querySelector('button').addEventListener('click', () => {
		modalImage.src = photo.url;
		modalImage.alt = photo.title;
		modalTitle.textContent = photo.title;
		modalDate.textContent = formatDate(photo.date);
		modalExplanation.textContent = photo.explanation;
		modal.classList.add('is-open');
		modal.setAttribute('aria-hidden', 'false');
		modalCloseButton.focus();
	});

	return item;
}

function createVideoPreview(photo) {
	if (photo.url.endsWith('.mp4')) {
		return `
			<video class="gallery-video gallery-video--player" controls preload="metadata" playsinline>
				<source src="${photo.url}" type="video/mp4" />
				Your browser does not support the video tag.
			</video>
		`;
	}

	const videoThumbnail = photo.thumbnail_url || getYouTubeThumbnail(photo.url);
	const hasThumbnail = Boolean(photo.thumbnail_url || videoThumbnail);

	if (hasThumbnail) {
		return `
			<div class="video-preview">
				<img class="gallery-video" src="${videoThumbnail}" alt="${photo.title} preview" />
				<span class="video-play">▶</span>
			</div>
		`;
	}

	return `
		<div class="video-preview video-preview--fallback">
			<div class="video-fallback-card">
				<span class="video-fallback-icon">▶</span>
				<p>Video preview unavailable</p>
			</div>
		</div>
	`;
}

function getYouTubeThumbnail(videoUrl) {
	try {
		const parsedUrl = new URL(videoUrl);
		let videoId = '';

		if (parsedUrl.hostname.includes('youtu.be')) {
			videoId = parsedUrl.pathname.replace('/', '');
		}

		if (parsedUrl.hostname.includes('youtube.com')) {
			videoId = parsedUrl.searchParams.get('v') || '';

			if (!videoId && parsedUrl.pathname.includes('/embed/')) {
				videoId = parsedUrl.pathname.split('/embed/')[1].split('/')[0];
			}
		}

		if (videoId) {
			return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
		}
	} catch (error) {
		// Fall through to the generic preview.
	}

	return '';
}

function renderGallery(photos) {
	gallery.innerHTML = '';
	photos.forEach((photo) => {
		gallery.appendChild(createGalleryItem(photo));
	});
}

function closeModal() {
	modal.classList.remove('is-open');
	modal.setAttribute('aria-hidden', 'true');
}

async function loadSpaceImages() {
	showLoadingMessage();

	try {
		const url = new URL(apodUrl);
		url.searchParams.set('api_key', apiKey);
		url.searchParams.set('thumbs', 'true');
		url.searchParams.set('start_date', startInput.value);
		url.searchParams.set('end_date', endInput.value);

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error('NASA request failed');
		}

		const data = await response.json();
		const photos = Array.isArray(data) ? data : [data];
		const displayablePhotos = photos.filter((photo) => photo.media_type === 'image' || photo.media_type === 'video');

		if (displayablePhotos.length === 0) {
			showEmptyMessage('No APOD results were returned for that date range.');
			return;
		}

		renderGallery(displayablePhotos);
	} catch (error) {
		showEmptyMessage('Something went wrong while loading the space photos.');
	}
}

showRandomSpaceFact();

getImagesButton.addEventListener('click', loadSpaceImages);

modalCloseButton.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
	if (event.target === modal) {
		closeModal();
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		closeModal();
	}
});
