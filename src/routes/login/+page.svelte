<script lang="ts">
	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');

	const handleLogin = async (event: Event) => {
		event.preventDefault();
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('http://localhost:3000/api/tokens', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					password
				})
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `Authentication failed: ${response.status}`);
			}

			const data = await response.json();

			// Store JWT token and user data
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));

			console.log('Login successful:', { user: data.user });

			// Redirect to sparks page on success
			window.location.href = '/sparks';
		} catch (error) {
			console.error('Login failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
		} finally {
			isLoading = false;
		}
	};
</script>

<svelte:head>
	<title>Login - Spark</title>
	<meta name="description" content="Login to your Spark content creative workspace" />
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<div class="logo-section">
			<h1 class="logo">✨ Spark</h1>
			<p class="tagline">Your Content Creative Workspace</p>
		</div>

		<form on:submit={handleLogin} class="login-form">
			{#if errorMessage}
				<div class="error-message">
					{errorMessage}
				</div>
			{/if}

			<div class="form-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					required
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter your password"
					required
				/>
			</div>

			<button type="submit" class="login-button" disabled={isLoading}>
				{isLoading ? 'Signing in...' : 'Sign in'}
			</button>
		</form>

		<div class="signup-section">
			<p>Don't have an account? <a href="/signup">Sign up</a></p>
		</div>

		<div class="feature-highlight">
			<p class="feature-text">
				Transform your ideas into compelling content with AI-powered insights from your backstory
			</p>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1rem;
	}

	.login-card {
		background: white;
		border-radius: 16px;
		padding: 2.5rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		width: 100%;
		max-width: 420px;
	}

	.logo-section {
		text-align: center;
		margin-bottom: 2rem;
	}

	.logo {
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0 0 0.5rem 0;
	}

	.tagline {
		color: #6b7280;
		font-size: 0.95rem;
		margin: 0;
	}

	.login-form {
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #374151;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.forgot-link {
		color: #667eea;
		text-decoration: none;
	}

	.forgot-link:hover {
		text-decoration: underline;
	}

	.login-button {
		width: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.875rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.login-button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.25);
	}

	.login-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.error-message {
		background-color: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.signup-section {
		text-align: center;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
		margin-bottom: 1.5rem;
	}

	.signup-section p {
		color: #6b7280;
		margin: 0;
	}

	.signup-section a {
		color: #667eea;
		text-decoration: none;
		font-weight: 500;
	}

	.signup-section a:hover {
		text-decoration: underline;
	}

	.feature-highlight {
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
	}

	.feature-text {
		color: #4b5563;
		font-size: 0.85rem;
		line-height: 1.4;
		margin: 0;
	}

	@media (max-width: 480px) {
		.login-card {
			padding: 1.5rem;
		}

		.logo {
			font-size: 2rem;
		}
	}
</style>