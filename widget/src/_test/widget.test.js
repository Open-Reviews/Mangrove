import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react'
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

test('Renders without crashing, key provided, profile loaded', async () => {
        localStorage.setItem('JWK', testPayloads.privateKey);
        render(<ErrorBoundary><App config={config} /></ErrorBoundary>);
        const x = await screen.findAllByText(/Piotr Piotrowski/i, {}, { timeout: 3000 });
        expect(x.length).toBeGreaterThan(0);
        userEvent.click(screen.getByText('+ Rate and Review'));
        await screen.findAllByText(/Describe your experience:/i, {}, { timeout: 3000 });
        await screen.findByDisplayValue(/kolec/i, {}, { timeout: 5000 });                
}); 

test('check filters', async()=>{
    render(<ErrorBoundary><App config={config} /></ErrorBoundary>);
    const x = await screen.findAllByTitle(/Show filters/i, {}, { timeout: 3000 });
    expect(x.length).toBeGreaterThan(0);
    const reviews1 = await screen.findAllByTestId('or-review');
    expect(reviews1.length).toBe(5);
    userEvent.click(screen.getByTitle("Show filters", {}, { timeout: 3000 }));
    await screen.findAllByText(/Age group/i, {}, { timeout: 3000 });
    await screen.findAllByText(/15-24/i, {}, { timeout: 3000 });
    await screen.findAllByText(/35-44/i, {}, { timeout: 3000 });
    userEvent.click(screen.getByText(/15-24/i, {}, { timeout: 3000 }));
    const reviews2 = await screen.findAllByTestId('or-review');
    expect(reviews2.length).toBe(2);
})