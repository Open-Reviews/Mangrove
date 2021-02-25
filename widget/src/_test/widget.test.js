import React from 'react';
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from '../ErrorBoundary';
import App from '../App'
import testPayloads from '../mocks/testPayloads'
import { configure } from '@testing-library/react'
configure({ asyncUtilTimeout: 4500 })

beforeEach(() => {
    localStorage.clear();
});

const config = {
    sub: 'https://example.com',
    title: 'example.com domain subject title',
};
const configWithBlacklist = {
    ...config,
    blacklist: "bqbKFAg-N_JPmIOrY4hlLznScxqx5sNAxLnPnXn04lzP1GnaMvtDNVd7_K2J3WXs-y2gaFZ2aZ4skhJ-09mybg,n45QPce7FXyamC_EsQOSRShsXLlmTUF7B0Z1u4P2TzYylEeblYADLiyY54rmtXTfAHQpe5s-vlciVBiI5OSKKQ"
};
const configWithLanguage = {
    ...config,
    language: "pl"
};
const configWithLanguageSelector = {
    ...config,
    language: "selector"
};
const configWithFilterOpinion = {
    ...config,
    filterOpinion: true
};
const configWithFilterAnonymous = {
    ...config,
    filterAnonymous: true
};
const configHidePhotos = {
    ...config,
    hidePhotos: true
};
const configRatingAlgo = {
    ...config,
    ratingAlgorithm: 'local'
};

test('Renders without crashing, key provided, profile loaded', async () => {
    localStorage.setItem('JWK', testPayloads.privateKey);
    render(<ErrorBoundary><App config={config} /></ErrorBoundary>);
    const x = await screen.findAllByText(/Piotr Piotrowski/i, {}, { timeout: 3000 });
    expect(x.length).toBeGreaterThan(0);
    userEvent.click(screen.getByText('+ Rate and Review'));
    await screen.findAllByText(/Describe your experience:/i, {}, { timeout: 3000 });
    await screen.findAllByText(/kolec/i, {}, { timeout: 5000 });
});

test('check filters', async () => {
    render(<ErrorBoundary><App config={config} /></ErrorBoundary>);
    const x = await screen.findAllByTitle(/Show filters/i, {}, { timeout: 3000 });
    expect(x.length).toBeGreaterThan(0);
    // by default language picker should not be shown.
    const languageFilter = await screen.queryByTitle('pl')
    expect(languageFilter).toBe(null)

    const reviews1 = await screen.findAllByTestId('or-review');
    expect(reviews1.length).toBe(9);
    userEvent.click(screen.getByTitle("Show filters", {}, { timeout: 3000 }));
    await screen.findAllByText(/Age group/i, {}, { timeout: 3000 });
    await screen.findAllByText(/15-24/i, {}, { timeout: 3000 });
    await screen.findAllByText(/35-44/i, {}, { timeout: 3000 });
    userEvent.click(screen.getByText(/15-24/i, {}, { timeout: 3000 }));
    const reviews2 = await screen.findAllByTestId('or-review');
    expect(reviews2.length).toBe(2);
})

test('check ratings only shown if present', async () => {
    render(<ErrorBoundary><App config={config} /></ErrorBoundary>);

    const reviews = await screen.findAllByTestId('or-review');
    expect(reviews.length).toBe(9);

    const ratings = screen.queryAllByTitle('Review Rating');
    expect(ratings.length).toBe(7);
})

test('check blacklist', async () => {
    render(<ErrorBoundary><App config={configWithBlacklist} /></ErrorBoundary>);
    const reviews = await screen.findAllByTestId('or-review');
    expect(reviews.length).toBe(7); // 9 - 2 blacklisted reviews
})

test('check language', async () => {
    render(<ErrorBoundary><App config={configWithLanguage} /></ErrorBoundary>);
    // language picker should not be shown.
    const languageFilter = await screen.queryByTitle('pl')
    expect(languageFilter).toBe(null)
    // pl text should be shown
    const plText = await screen.findAllByText('Oceń i zrecenzuj');
    expect(plText.length).toBeGreaterThan(0);
})

test('check language selector', async () => {
    render(<ErrorBoundary><App config={configWithLanguageSelector} /></ErrorBoundary>);
    // language picker should be shown.
    const languageFilters = await screen.findAllByTitle('pl')
    expect(languageFilters.length).toBe(1);
})

test('check filter anonymous', async () => {
    render(<ErrorBoundary><App config={configWithFilterAnonymous} /></ErrorBoundary>);
    const reviews = await screen.findAllByTestId('or-review');
    expect(reviews.length).toBe(7); // 9 - 2 anonymous
})

test('check hide photos', async () => {
    render(<ErrorBoundary><App config={configHidePhotos} /></ErrorBoundary>);
    await screen.findAllByTestId('or-review');
    const galleries = screen.queryAllByTitle('Review Gallery');
    expect(galleries.length).toBe(0);
})

test('check default rating algorithm', async () => {
    // algo = 'mangrove'
    render(<ErrorBoundary><App config={config} /></ErrorBoundary>);
    await screen.findAllByTestId('or-review');
    const rating = await screen.getByTitle('Rating');
    expect(rating).toHaveTextContent("3.1");
})

test('check local rating algorithm', async () => {
    // algo = 'local'
    render(<ErrorBoundary><App config={configRatingAlgo} /></ErrorBoundary>);
    await screen.findAllByTestId('or-review');
    const rating = await screen.getByTitle('Rating');
    expect(rating).toHaveTextContent("4.8");
})
