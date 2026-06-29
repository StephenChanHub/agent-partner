import { InitialAvatar } from '../components/InitialAvatar';
import { homeAgents } from '../config/agents';
import './HomePage.css';

export function HomePage() {
  return (
    <main className="user-home-shell">
      <header className="user-home-header">
        <div className="brand-text">DID Agent Partner</div>
        <InitialAvatar name="User" size="sm" />
      </header>

      <section className="partner-stage" aria-labelledby="partner-title">
        <div className="stage-copy">
          <h1 id="partner-title">Select your partner</h1>
        </div>

        <div className="agent-carousel" aria-label="Agent partner cards">
          {homeAgents.map((agent, index) => (
            <article
              key={agent.id}
              className={`agent-card ${index === 0 ? 'agent-card--featured' : ''}`}
              aria-label={`${agent.name} agent card`}
            >
              <div className="card-glow" />
              <InitialAvatar name={agent.name} size="xl" className="agent-avatar" />
              <h2>{agent.name}</h2>
              <p>{agent.description}</p>
              <button className="start-button" type="button">start</button>
            </article>
          ))}
        </div>

        <div className="carousel-dots" aria-hidden="true">
          <span className="dot dot--active" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </section>
    </main>
  );
}
