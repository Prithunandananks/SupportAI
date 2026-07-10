
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('renders login form', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });
});
