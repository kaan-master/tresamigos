import { FormEvent, useEffect, useMemo, useState } from "react";
import { storeLabel, type CountCategory, type CountList, type CountLocationOption, type CountSession, type CountShift, type CountStaffSessionUser } from "@tresamigos/types";
import { dismissSiteBoot } from "../lib/waitForPageImages";
import {
  clearTellingListId,
  clearTellingToken,
  fetchCurrentCount,
  fetchTellingCatalog,
  fetchTellingMe,
  getTellingListId,
  getTellingToken,
  loginTelling,
  logoutTelling,
  saveTellingCount,
  setTellingListId,
  setTellingToken,
  submitTellingCount
} from "../lib/tellingApi";
import "./telling.css";

type LineState = Record<string, { quantity: string; note: string; noteOpen: boolean }>;

function todayAmsterdam() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function defaultShift(): CountShift {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", hour12: false }).format(new Date())
  );
  return hour < 15 ? "morning" : "evening";
}

function parseQuantity(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

function linesFromSession(session: CountSession | null, catalog: CountCategory[]): LineState {
  const next: LineState = {};
  for (const category of catalog) {
    for (const product of category.products) {
      next[product.id] = { quantity: "", note: "", noteOpen: false };
    }
  }
  if (!session) return next;
  for (const line of session.lines) {
    if (!line.productId) continue;
    next[line.productId] = {
      quantity: line.quantity === null ? "" : String(line.quantity).replace(".", ","),
      note: line.note,
      noteOpen: Boolean(line.note)
    };
  }
  return next;
}

function NumberPad({
  title,
  value,
  decimal,
  maxLength,
  onChange,
  onClose
}: {
  title: string;
  value: string;
  decimal?: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  function push(key: string) {
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === ",") {
      if (!decimal || value.includes(",")) return;
      onChange(value ? `${value},` : "0,");
      return;
    }
    if (maxLength && value.replace(",", "").length >= maxLength) return;
    if (value === "0" && key !== ",") onChange(key);
    else onChange(`${value}${key}`);
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", decimal ? "," : "", "0", "back"];

  return (
    <div className="telling-pad-wrap">
      <button type="button" className="telling-pad-dim" aria-label="Sluiten" onClick={onClose} />
      <div className="telling-pad">
        <p>{title}</p>
        <strong>{value || (decimal ? "0" : "")}</strong>
        <div className="telling-pad-grid">
          {keys.map((key, index) =>
            key ? (
              <button type="button" key={key} onClick={() => push(key)}>
                {key === "back" ? "⌫" : key}
              </button>
            ) : (
              <span key={`empty-${index}`} />
            )
          )}
        </div>
        <button type="button" className="telling-btn" onClick={onClose}>
          Klaar
        </button>
      </div>
    </div>
  );
}

export function TellingPage() {
  const [pin, setPin] = useState("");
  const [pinPad, setPinPad] = useState(false);
  const [token, setToken] = useState(getTellingToken());
  const [staff, setStaff] = useState<CountStaffSessionUser | null>(null);
  const [locations, setLocations] = useState<CountLocationOption[]>([]);
  const [lists, setLists] = useState<CountList[]>([]);
  const [listsReady, setListsReady] = useState(false);
  const [listId, setListId] = useState(getTellingListId());
  const [catalog, setCatalog] = useState<CountCategory[]>([]);
  const [locationId, setLocationId] = useState("");
  const [shift, setShift] = useState<CountShift>(defaultShift());
  const [session, setSession] = useState<CountSession | null>(null);
  const [lines, setLines] = useState<LineState>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [pad, setPad] = useState<{ productId: string; name: string } | null>(null);

  const countDate = todayAmsterdam();
  const locked = session?.status === "submitted";
  const locationName =
    storeLabel(
      locations.find((item) => item.id === locationId)?.code || staff?.locationCode,
      locations.find((item) => item.id === locationId)?.name || staff?.locationName || ""
    ) || "";
  const listTitle = lists.find((item) => item.id === listId)?.title || "";

  useEffect(() => {
    dismissSiteBoot();
    document.title = "Telling | Tres Amigos";
  }, []);

  useEffect(() => {
    if (!token) return;
    void fetchTellingMe()
      .then((data) => {
        setStaff(data.staff);
        setLocations(data.locations);
        setLists(data.lists);
        setListsReady(true);
        setLocationId(data.staff.locationId || data.locations[0]?.id || "");
        if (listId && !data.lists.some((list) => list.id === listId)) {
          clearTellingListId();
          setListId("");
        }
      })
      .catch(() => {
        clearTellingToken();
        setToken("");
      });
  }, [token]);

  useEffect(() => {
    if (!token || !listId) {
      setCatalog([]);
      return;
    }
    void fetchTellingCatalog(listId)
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, [token, listId]);

  useEffect(() => {
    if (!token || !locationId || !listId || !catalog.length) return;
    void fetchCurrentCount(locationId, shift, listId, countDate)
      .then((current) => {
        setSession(current);
        setLines(linesFromSession(current, catalog));
      })
      .catch(() => {
        setSession(null);
        setLines(linesFromSession(null, catalog));
      });
  }, [token, locationId, shift, countDate, catalog, listId]);

  const canSwitchStore = useMemo(() => locations.length > 1, [locations.length]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await loginTelling(pin);
      setTellingToken(data.token);
      setToken(data.token);
      setStaff(data.staff);
      clearTellingListId();
      setListId("");
      setPin("");
      setPinPad(false);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Inloggen mislukt.");
    } finally {
      setBusy(false);
    }
  }

  function payload() {
    return {
      locationId,
      listId,
      shift,
      countDate,
      lines: catalog.flatMap((category) =>
        category.products.map((product) => ({
          productId: product.id,
          quantity: parseQuantity(lines[product.id]?.quantity || ""),
          note: lines[product.id]?.note || ""
        }))
      )
    };
  }

  async function handleSave() {
    if (locked || !locationId || !listId) return;
    setBusy(true);
    setError("");
    try {
      const saved = await saveTellingCount(payload());
      setSession(saved);
      setStatus("Opgeslagen");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Opslaan mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (locked || !locationId || !listId) return;
    if (!window.confirm("Telling verzenden? Daarna kun je hem niet meer wijzigen.")) return;
    setBusy(true);
    setError("");
    try {
      const saved = await saveTellingCount(payload());
      const submitted = await submitTellingCount(saved.id);
      setSession(submitted);
      setStatus("Verzonden");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Verzenden mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutTelling();
    } catch {
      /* ignore */
    }
    clearTellingToken();
    setToken("");
    setStaff(null);
    setListId("");
    setListsReady(false);
    setCatalog([]);
    setSession(null);
  }

  function chooseList(id: string) {
    setTellingListId(id);
    setListId(id);
    setSession(null);
    setStatus("");
  }

  if (!token || !staff) {
    return (
      <div className="telling-app telling-login">
        <form className="telling-login-card" onSubmit={handleLogin}>
          <img src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos" />
          <h1>Telling</h1>
          <p>Tik op het nummer om in te loggen.</p>
          <button type="button" className={`telling-pin${pin ? "" : " is-placeholder"}`} onClick={() => setPinPad(true)}>
            {pin || "000000000"}
          </button>
          {error ? <p className="telling-error">{error}</p> : null}
          <button className="telling-btn" type="submit" disabled={busy || pin.length !== 9 || /geblokkeerd/i.test(error)}>
            {busy ? "Bezig…" : "Inloggen"}
          </button>
        </form>
        {pinPad ? (
          <NumberPad title="Inlognummer" value={pin} maxLength={9} onChange={setPin} onClose={() => setPinPad(false)} />
        ) : null}
      </div>
    );
  }

  if (!listId) {
    return (
      <div className="telling-app telling-login">
        <div className="telling-login-card">
          <img src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos" />
          <h1>Kies een lijst</h1>
          <p>{staff.name}, welke telling wil je doen?</p>
          {!lists.length ? <p>{listsReady ? "Er staan nog geen lijsten klaar." : "Lijsten laden…"}</p> : null}
          <div className="telling-lists">
            {lists.map((list) => (
              <button type="button" className="telling-list-card" key={list.id} onClick={() => chooseList(list.id)}>
                <strong>{list.title}</strong>
                <span>Tik om te starten</span>
              </button>
            ))}
          </div>
          <button className="telling-btn secondary" type="button" onClick={() => void handleLogout()}>
            Uitloggen
          </button>
        </div>
      </div>
    );
  }

  const padLine = pad ? lines[pad.productId] : null;

  return (
    <div className="telling-app">
      <div className="telling-shell">
        <header className="telling-top">
          <div className="telling-top-row">
            <h1>{listTitle || "Telling"}</h1>
            <div className="telling-top-actions">
              <button className="telling-btn secondary" type="button" onClick={() => { clearTellingListId(); setListId(""); }} style={{ width: "auto", padding: "10px 14px" }}>
                Lijsten
              </button>
              <button className="telling-btn secondary" type="button" onClick={() => void handleLogout()} style={{ width: "auto", padding: "10px 14px" }}>
                Uit
              </button>
            </div>
          </div>
          {canSwitchStore ? (
            <select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              {locations.map((location) => (
                <option value={location.id} key={location.id}>
                  {storeLabel(location.code, location.name)}
                </option>
              ))}
            </select>
          ) : null}
          <div className="telling-shift">
            <button type="button" className={shift === "morning" ? "is-active" : ""} onClick={() => setShift("morning")}>
              Ochtendtelling
            </button>
            <button type="button" className={shift === "evening" ? "is-active" : ""} onClick={() => setShift("evening")}>
              Avondtelling
            </button>
          </div>
          <p className="telling-status">
            {staff.name} · {locationName || "Winkel"} · {countDate}
            {locked ? " · Verzonden" : status ? ` · ${status}` : ""}
          </p>
          {error ? <p className="telling-error">{error}</p> : null}
        </header>

        <div className={locked ? "telling-readonly" : ""}>
          {catalog.map((category) => (
            <section className="telling-category" key={category.id}>
              <h2>{category.name}</h2>
              {category.products.map((product) => {
                const line = lines[product.id] || { quantity: "", note: "", noteOpen: false };
                return (
                  <article className="telling-item" key={product.id}>
                    <div className="telling-item-head">
                      <strong>{product.name}</strong>
                      <button
                        type="button"
                        className={`telling-qty${line.quantity ? "" : " is-placeholder"}`}
                        onClick={() => !locked && setPad({ productId: product.id, name: product.name })}
                      >
                        {line.quantity || "0"}
                      </button>
                    </div>
                    {line.noteOpen || line.note ? (
                      <input
                        className="telling-note"
                        value={line.note}
                        placeholder="opmerking"
                        onChange={(event) =>
                          setLines((current) => ({
                            ...current,
                            [product.id]: { ...line, note: event.target.value, noteOpen: true }
                          }))
                        }
                      />
                    ) : (
                      <button
                        className="telling-note-toggle"
                        type="button"
                        onClick={() =>
                          setLines((current) => ({
                            ...current,
                            [product.id]: { ...line, noteOpen: true }
                          }))
                        }
                      >
                        + opmerking
                      </button>
                    )}
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      </div>

      {!locked ? (
        <div className="telling-bar">
          <button className="telling-btn secondary" type="button" disabled={busy} onClick={() => void handleSave()}>
            Opslaan
          </button>
          <button className="telling-btn" type="button" disabled={busy} onClick={() => void handleSubmit()}>
            Verzenden
          </button>
        </div>
      ) : null}

      {pad && padLine ? (
        <NumberPad
          title={pad.name}
          value={padLine.quantity}
          decimal
          onChange={(quantity) =>
            setLines((current) => ({
              ...current,
              [pad.productId]: { ...(current[pad.productId] || padLine), quantity }
            }))
          }
          onClose={() => setPad(null)}
        />
      ) : null}
    </div>
  );
}
