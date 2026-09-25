import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Temple } from "@/lib/data";

export function AboutView({ temples }: { temples: Temple[] }) {
  const byCountry = new Map<string, Temple[]>();
  for (const temple of temples) {
    const country = temple.country || "Country to be added";
    const list = byCountry.get(country) || [];
    list.push(temple);
    byCountry.set(country, list);
  }
  const regions = [...byCountry.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="about-board">
      <article className="about-meaning">
        <figure className="about-meaning-stage">
          <Image
            className="about-meaning-image"
            src="/about/brihat-mridanga-meaning.png"
            alt="An open book with a world map rising from its pages"
            fill
            sizes="(max-width: 1260px) 100vw, 1260px"
            priority
          />
          <div className="about-meaning-veil" aria-hidden="true" />
          <div className="about-meaning-copy">
            <h2>The meaning of Brihat Mridanga</h2>
          </div>
        </figure>
        <div className="about-meaning-panel">
          <p>
            The traditional mridanga is used in sankirtan, the congregational
            chanting of the holy names. A physical mridanga can be heard by
            people nearby, but book distribution is described by Śrīla
            Prabhupāda as a “Brihat Mridanga” because books can spread the
            message of Kṛṣṇa consciousness much farther and for a much longer
            time.
          </p>
        </div>
      </article>
      <article className="about-vision">
        <figure className="about-vision-stage">
          <Image
            className="about-vision-image"
            src="/about/prabhupada-vision.jpg"
            alt="A devotee offering a book to a person sitting on a city street"
            fill
            sizes="(max-width: 1260px) 100vw, 1260px"
          />
          <div className="about-vision-veil" aria-hidden="true" />
          <h2>Srila Prabhupada’s vision for book distribution</h2>
        </figure>
        <div className="about-vision-letters">
          <blockquote className="about-letter about-vision-quote">
            <p>
              This is our greatest weapon. The more the books are distributed,
              the more the ignorance of the Age of Kali will be smashed. The
              world is feeling the weight of this Hare Krishna Movement,
              especially in your country. We have to increase this book
              distribution work more and more to firmly establish this
              Movement, which is the only hope for the suffering living
              entities.
            </p>
            <footer>Letter to Balavanta — Vrindaban, 23 November 1976</footer>
          </blockquote>
          <blockquote className="about-letter about-vision-quote">
            <p>
              Regarding printing our books and literatures, I may inform you
              in this connection that I saw one bulletin of “Indian Railways”
              in which it was specifically advised that every railway servant
              should see to it that the wheels of the carriages or vehicles
              must be moving always, which means that the railway is going
              nicely. Similarly all of us should see that our literatures are
              profusely distributed. That means that our missionary work is
              going on nicely. Otherwise we are simply sleeping and eating.
              The literature we have already designated as brihat mrdanga. So
              distribution of literature means great Sankirtana.
            </p>
            <footer>Letter to Karandhara — Nairobi, 9 October 1971</footer>
          </blockquote>
        </div>
      </article>
      <article className="about-mission">
        <div className="about-mission-grid">
          <div className="about-mission-copy">
            <h2>
              The<br />platform’s<br />mission
            </h2>
            <p className="about-mission-lead">
              Brihat Mridanga is a shared home for the book-distribution
              community.
            </p>
            <div className="about-mission-pills">
              <div className="about-mission-pill about-mission-pill-1">
                <span className="about-mission-pill-num">01</span>
                <p>
                  Temple reports, campaigns, stories, training resources and
                  events sit here, so service offered in many places can be seen
                  as one offering.
                </p>
              </div>
              <div className="about-mission-pill about-mission-pill-2">
                <span className="about-mission-pill-num">02</span>
                <p>
                  Each distribution is entered once. Temple, centre, team,
                  individual, campaign and global views all draw from that same
                  record — a clear picture, without counting the same book twice.
                </p>
              </div>
            </div>
          </div>
          <figure className="about-mission-figure">
            <div className="about-mission-frame">
              <Image
                className="about-mission-image"
                src="/about/prabhupada-reading.jpg"
                alt="Śrīla Prabhupāda reading from an open book"
                fill
                sizes="(max-width: 900px) 100vw, 480px"
              />
            </div>
          </figure>
        </div>
      </article>
      <article className="about-lead">
        <div className="about-lead-copy">
          <h2>Leadership and supporting teams</h2>
          <ul className="about-lead-points">
            <li>
              <h3>One movement</h3>
              <p>
                The platform is cared for as one movement: temples, scoring,
                shared content and corrections wherever they are needed.
              </p>
            </li>
            <li>
              <h3>Each temple</h3>
              <p>
                Each participating temple records its own distribution, keeps
                individual and team names, and can publish stories, resources
                or events for that temple. Congregation here means a
                book-distribution team, with one team lead for each team.
              </p>
            </li>
            <li>
              <h3>Teams and centres</h3>
              <p>
                Team leads and individual sankirtan devotees are honoured as
                records of service. They do not sign in at this stage; their
                temple enters the work on their behalf. Centres, where a
                temple has them, are places of service under that temple — not
                a separate layer of login.
              </p>
            </li>
          </ul>
        </div>
        <figure className="about-lead-frame">
          <Image
            className="about-lead-image"
            src="/about/platform-mission.jpg"
            alt="A devotee showing a book to a person as they look at it together"
            fill
            sizes="(max-width: 980px) 70vw, 380px"
          />
        </figure>
      </article>
      <article className="about-card has-banner">
        <figure className="about-card-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/about/iskcon-bengaluru-tower.jpg"
            alt="Bright daytime view of the ISKCON Bengaluru temple towers under open sky"
            loading="lazy"
            decoding="async"
          />
        </figure>
        <h2>Participating regions</h2>
        <p>
          The movement is organised by country, then temple, then an optional
          centre. As temples are added, they appear here and in the temple
          directory.
        </p>
        {regions.length ? (
          <div className="about-regions">
            {regions.map(([country, list]) => (
              <div key={country} className="about-region">
                <h3>
                  {country}
                  <small>
                    {list.length} {list.length === 1 ? "temple" : "temples"}
                  </small>
                </h3>
                <ul>
                  {list
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((temple) => (
                      <li key={temple.id}>
                        <Link href={`/temples/${temple.id}`}>
                          {temple.name}
                          {temple.city ? ` · ${temple.city}` : ""}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p>
            Participating countries and temples will be listed here as they
            are added.
          </p>
        )}
        <Link className="text-link" href="/temples">
          Open the temple directory <ArrowUpRight size={15} />
        </Link>
      </article>
      <article className="about-card">
        <h2>Contact</h2>
        <p>
          For a specific temple, start with that temple’s page in the
          directory. The people serving there are the right first point of
          contact for local programmes, teams and distribution.
        </p>
        <p>
          Those serving at each temple sign in through the Temple Portal to
          record service and keep public pages current. A dedicated public
          correspondence address will be published here when the movement
          confirms it.
        </p>
        <div className="about-actions">
          <Link className="button" href="/temples">
            Find a temple <ArrowUpRight size={17} />
          </Link>
          <Link className="text-link" href="/login">
            Temple Portal sign-in
          </Link>
        </div>
      </article>
    </div>
  );
}
