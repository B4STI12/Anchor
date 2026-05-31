import {
  Component, OnInit, OnDestroy, inject, signal, computed, HostListener, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmailService } from '../../shared/services/email.service';
import type { EmailRecord, AccountRecord, TemplateRecord } from '../../shared/services/email.service';

type EmailNav = 'inbox' | 'starred' | 'sent' | 'archived';
type EmailCategory = 'all' | 'newsletter' | 'spam' | 'important' | 'receipt' | 'other';
type ReplyMode = 'none' | 'reply' | 'replyAll' | 'forward';
type Phase = 'loading' | 'onboarding' | 'app';

const CATEGORIES: Record<string, { label: string; color: string }> = {
  newsletter: { label: 'Newsletter', color: '#F59E0B' },
  spam:       { label: 'Spam',       color: '#EF4444' },
  important:  { label: 'Important',  color: '#3B82F6' },
  receipt:    { label: 'Receipt',    color: '#22C55E' },
  other:      { label: 'Other',      color: '#6b7488' },
};

function formatDate(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getSnoozePresets(): { id: string; label: string; hint: string; ts: number }[] {
  const now = new Date();
  const todayAt = (h: number) => { const d = new Date(now); d.setHours(h, 0, 0, 0); return d; };
  const nextDay = (dayOfWeek: number, h: number) => {
    const d = new Date(now);
    const diff = ((dayOfWeek - d.getDay() + 7) % 7) || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(h, 0, 0, 0);
    return d;
  };
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const weekend = nextDay(6, 9);
  const nextWeek = nextDay(1, 9);
  const laterToday = todayAt(17);
  return [
    { id: 'later',   label: 'Later today',     hint: `${laterToday.getHours()}:00 PM today`, ts: laterToday.getTime() },
    { id: 'tmrw',    label: 'Tomorrow morning', hint: `${days[tomorrow.getDay()]}, 9:00 AM`,  ts: tomorrow.getTime() },
    { id: 'weekend', label: 'This weekend',     hint: `${days[weekend.getDay()]}, 9:00 AM`,   ts: weekend.getTime() },
    { id: 'next',    label: 'Next week',        hint: `${days[nextWeek.getDay()]} ${months[nextWeek.getMonth()]} ${nextWeek.getDate()}, 9:00 AM`, ts: nextWeek.getTime() },
  ];
}

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="email-root">
  <!-- Internal email sidebar -->
  <aside class="email-rail">
    <button class="rail-compose" (click)="composeOpen.set(true)" title="New message (C)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/>
        <path d="M15.828 3.172a2 2 0 0 1 2.828 0l2.172 2.172a2 2 0 0 1 0 2.828L12 17l-4 1 1-4 9-10.828z"/>
      </svg>
    </button>

    <div class="rail-accounts">
      @for (a of accounts(); track a.id) {
        <button class="rail-account-dot"
          [style.background]="a.color"
          [class.active]="activeAccount() === a.id"
          (click)="activeAccount.set(a.id)"
          [title]="a.email">
          {{ (a.display_name || a.email || '?')[0].toUpperCase() }}
        </button>
      }
      <button class="rail-add-account" (click)="showOnboarding()" title="Add account">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>

    <div class="rail-divider"></div>

    <nav class="rail-nav">
      <button class="rail-nav-btn" [class.active]="activeNav() === 'inbox'" (click)="setNav('inbox')" title="Inbox">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </svg>
      </button>
      <button class="rail-nav-btn" [class.active]="activeNav() === 'starred'" (click)="setNav('starred')" title="Starred">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
      <button class="rail-nav-btn" [class.active]="activeNav() === 'sent'" (click)="setNav('sent')" title="Sent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
      <button class="rail-nav-btn" [class.active]="activeNav() === 'archived'" (click)="setNav('archived')" title="Archive">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
        </svg>
      </button>
    </nav>

    <div class="rail-spacer"></div>

    <button class="rail-nav-btn rail-quickclean" (click)="openQuickClean()" title="QuickClean">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </button>
  </aside>

  <!-- Main content area -->
  <main class="email-main">
    @if (phase() === 'loading') {
      <div class="state-center"><span class="muted-text">Loading…</span></div>
    } @else if (phase() === 'onboarding') {
      <!-- Onboarding -->
      <div class="onboarding-wrap">
        <div class="onboarding-card">
          <div class="onboarding-logo">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4.5L8 9L14 4.5M2 4.5V12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4.5M2 4.5h12" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="onboarding-app-name">Email</span>
        </div>

        @if (onboardingError()) {
          <div class="error-banner">{{ onboardingError() }}</div>
        }

        @if (onboardingPhase() === 'start') {
          <h2 class="onboarding-title">Connect your first account</h2>
          <p class="onboarding-desc">Email reads, categorizes, and helps you triage — all locally on your machine. Your messages never leave your device.</p>
          <div class="onboarding-btns">
            <button class="provider-btn" (click)="startConnect('gmail')">
              <span class="provider-logo gmail-logo">G</span>
              <span>Connect Gmail</span>
              <svg class="chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7488" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="provider-btn" (click)="startConnect('outlook')">
              <span class="provider-logo outlook-logo">O</span>
              <span>Connect Outlook</span>
              <svg class="chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7488" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          @if (accounts().length > 0) {
            <button class="btn-secondary mt-12" (click)="phase.set('app')">Go to inbox →</button>
          }
        } @else if (onboardingPhase() === 'setup-gmail' || onboardingPhase() === 'setup-outlook') {
          <h2 class="onboarding-title">OAuth app credentials</h2>
          <p class="onboarding-desc">
            @if (onboardingPhase() === 'setup-gmail') {
              Create a Google Cloud project, enable the Gmail API, and add an OAuth 2.0 Client ID (Desktop app type). Paste the credentials below.
            } @else {
              Register an app in Azure AD (Entra), add <code>anchor://oauth/outlook</code> as a redirect URI, and paste the credentials below.
            }
          </p>
          <div class="creds-form">
            <div class="creds-row">
              <label class="creds-label">Client ID</label>
              <input class="creds-input" [(ngModel)]="setupClientId" placeholder="{{ onboardingPhase() === 'setup-gmail' ? 'xxxxx.apps.googleusercontent.com' : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }}" autocomplete="off" />
            </div>
            @if (onboardingPhase() === 'setup-gmail') {
              <div class="creds-row">
                <label class="creds-label">Client Secret</label>
                <input class="creds-input" [(ngModel)]="setupClientSecret" type="password" placeholder="GOCSPX-…" autocomplete="off" />
              </div>
            }
            <div class="creds-hint">
              @if (onboardingPhase() === 'setup-gmail') {
                <a class="creds-link" (click)="openExternal('https://console.cloud.google.com/apis/credentials')">Open Google Cloud Console ↗</a>
              } @else {
                <a class="creds-link" (click)="openExternal('https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade')">Open Azure App Registrations ↗</a>
              }
            </div>
          </div>
          <div class="onboarding-btns mt-12">
            <button class="btn-primary" (click)="saveCredsAndConnect()" [disabled]="!setupClientId.trim() || setupSaving()">
              {{ setupSaving() ? 'Saving…' : 'Save & Connect' }}
            </button>
            <button class="btn-secondary" (click)="onboardingPhase.set('start')">Back</button>
          </div>
        } @else if (onboardingPhase() === 'loading') {
          <h2 class="onboarding-title">Connecting…</h2>
          <p class="onboarding-desc">A browser window should open. Approve access to continue.</p>
          <div class="connect-status">
            <div class="spinner"></div>
            <div>
              <div class="connect-label">Redirecting to {{ pendingProvider() === 'outlook' ? 'Microsoft' : 'Google' }} OAuth…</div>
              <div class="connect-sub">Waiting for authorization</div>
            </div>
          </div>
          <button class="btn-secondary mt-12" (click)="onboardingPhase.set('start')">Cancel</button>
        } @else if (onboardingPhase() === 'added') {
          <h2 class="onboarding-title">You're all set</h2>
          <p class="onboarding-desc">Add another account, or jump into triage.</p>
          @if (connectedAccount()) {
            <div class="connected-account">
              <div class="acct-avatar" [style.background]="connectedAccount()!.color">
                {{ (connectedAccount()!.email || '?')[0].toUpperCase() }}
              </div>
              <div class="acct-info">
                <div class="acct-email">{{ connectedAccount()!.email }}</div>
                <div class="acct-status">● Connected · syncing…</div>
              </div>
            </div>
          }
          <button class="provider-btn dashed mt-8" (click)="onboardingPhase.set('start')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add another account
          </button>
          <button class="btn-primary mt-8" (click)="phase.set('app')">Continue to inbox →</button>
        }
      </div>
    } @else {
      <!-- App: search bar -->
      <div class="email-topbar">
        <input
          #searchInput
          class="search-input"
          [placeholder]="'Search email…'"
          [(ngModel)]="searchQuery"
          (input)="onSearchInput()"
          (keydown.escape)="clearSearch()"
        />
        <div class="topbar-right">
          <span class="sync-status">{{ syncStatus() }}</span>
          <button class="btn-icon" (click)="doSyncNow()" title="Sync now">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Email list -->
      <div class="email-body">
        @if (searchQuery.trim()) {
          <!-- Search results -->
          <div class="email-list-panel">
            <div class="list-header">
              <span class="list-title">Search results</span>
              <span class="list-count">{{ searchResults().length }}</span>
              <button class="btn-ghost ml-auto" (click)="clearSearch()">Clear</button>
            </div>
            @if (listLoading()) {
              <div class="state-center"><span class="muted-text">Searching…</span></div>
            } @else if (searchResults().length === 0) {
              <div class="state-center"><span class="muted-text">No results.</span></div>
            } @else {
              <div class="email-scroll">
                @for (email of searchResults(); track email.id) {
                  <div class="email-row"
                    [class.open]="openEmailId() === email.id"
                    [class.selected]="selected().includes(email.id)"
                    [class.unread]="!email.is_read"
                    (click)="openEmail(email.id)">
                    <ng-container *ngTemplateOutlet="emailRowContent; context: { email }"></ng-container>
                  </div>
                }
              </div>
            }
          </div>
        } @else if (activeNav() === 'inbox') {
          <!-- Inbox / triage -->
          <div class="email-list-panel">
            <div class="list-header">
              <span class="list-title">Inbox</span>
              <span class="list-count">{{ filteredEmails().length }}</span>
              @if (selected().length > 0) {
                <div class="bulk-actions ml-8">
                  <button class="btn-action" (click)="archiveSelected()">Archive ({{ selected().length }})</button>
                  <button class="btn-action red" (click)="deleteSelected()">Delete</button>
                  <button class="btn-action ghost" (click)="selected.set([])">Deselect</button>
                </div>
              }
            </div>
            <div class="filter-chips">
              @for (chip of filterChips; track chip.id) {
                <button class="chip" [class.active]="filter() === chip.id" (click)="filter.set(chip.id)">
                  {{ chip.label }}
                </button>
              }
            </div>
            @if (listLoading()) {
              <div class="state-center"><span class="muted-text">Loading…</span></div>
            } @else if (filteredEmails().length === 0) {
              <div class="state-center"><span class="muted-text">All clear ✓</span></div>
            } @else {
              <div class="email-scroll">
                @for (email of filteredEmails(); track email.id) {
                  <div class="email-row"
                    [class.open]="openEmailId() === email.id"
                    [class.selected]="selected().includes(email.id)"
                    [class.unread]="!email.is_read"
                    (click)="openEmail(email.id)">
                    <ng-container *ngTemplateOutlet="emailRowContent; context: { email }"></ng-container>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <!-- Starred / sent / archived -->
          <div class="email-list-panel">
            <div class="list-header">
              <span class="list-title">{{ navLabel() }}</span>
              <span class="list-count">{{ otherEmails().length }}</span>
            </div>
            @if (listLoading()) {
              <div class="state-center"><span class="muted-text">Loading…</span></div>
            } @else if (otherEmails().length === 0) {
              <div class="state-center"><span class="muted-text">No messages.</span></div>
            } @else {
              <div class="email-scroll">
                @for (email of otherEmails(); track email.id) {
                  <div class="email-row"
                    [class.open]="openEmailId() === email.id"
                    [class.unread]="!email.is_read"
                    (click)="openEmail(email.id)">
                    <ng-container *ngTemplateOutlet="emailRowContent; context: { email }"></ng-container>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Reading pane overlay -->
        @if (openEmailId()) {
          <div class="rp-backdrop" (click)="closeEmail()"></div>
          <div class="reading-pane">
            @if (rpLoading()) {
              <div class="state-center"><div class="spinner"></div></div>
            } @else if (!openEmail_data()) {
              <div class="state-center"><span class="muted-text">Email not found</span></div>
            } @else {
              <div class="rp-header">
                <div class="rp-header-top">
                  <div class="rp-header-left">
                    <button class="btn-icon" (click)="closeEmail()" title="Close (Esc)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <span class="cat-badge" [style.color]="catColor(openEmail_data()!.category)" [style.background]="catColor(openEmail_data()!.category) + '1f'">
                      {{ catLabel(openEmail_data()!.category) }}
                    </span>
                    <button class="btn-xs" (click)="toggleRead()">{{ openEmail_data()!.is_read ? 'Mark unread' : 'Mark read' }}</button>
                  </div>
                  <div class="rp-actions">
                    <button class="btn-action" [class.starred]="openEmail_data()!.is_starred" (click)="toggleStar()" title="Star">★</button>
                    <button class="btn-action red-hover" (click)="rpUnsubscribe()" title="Unsubscribe">Unsub</button>
                    <button class="btn-action" (click)="rpArchive()" title="Archive (E)">Archive</button>
                    <div class="snooze-wrap" style="position:relative">
                      <button class="btn-action" (click)="snoozeOpen.set(!snoozeOpen())" title="Snooze">Snooze</button>
                      @if (snoozeOpen()) {
                        <div class="snooze-popover" (click)="$event.stopPropagation()">
                          <div class="snooze-title">Snooze until</div>
                          @for (p of snoozePresets; track p.id) {
                            <button class="snooze-row" (click)="doSnooze(p.ts)">
                              <span>{{ p.label }}</span>
                              <span class="muted-text">{{ p.hint }}</span>
                            </button>
                          }
                          <div class="snooze-custom">
                            <div class="snooze-custom-label">Custom</div>
                            <div class="snooze-custom-row">
                              <input type="date" [(ngModel)]="customSnoozeDate" class="snooze-input" />
                              <input type="time" [(ngModel)]="customSnoozeTime" value="09:00" class="snooze-input" style="width:90px" />
                            </div>
                            <button class="btn-primary snooze-btn" (click)="doCustomSnooze()">Snooze</button>
                          </div>
                        </div>
                      }
                    </div>
                    <button class="btn-action red-hover" (click)="rpDelete()" title="Delete (#)">Delete</button>
                  </div>
                </div>
                <h2 class="rp-subject">{{ openEmail_data()!.subject }}</h2>
                <div class="rp-meta">
                  <div class="rp-avatar" [style.background]="rpAcct()?.color + '40'" [style.color]="rpAcct()?.color || 'var(--accent)'">
                    {{ (openEmail_data()!.sender_name || openEmail_data()!.sender_email || '?')[0] }}
                  </div>
                  <div class="rp-sender-info">
                    <span class="rp-sender-name">{{ openEmail_data()!.sender_name }}</span>
                    <span class="rp-sender-email"> &lt;{{ openEmail_data()!.sender_email }}&gt;</span>
                    <div class="rp-to">to {{ rpAcct()?.email }} · {{ openEmail_data()!.date | date:'medium' }}</div>
                  </div>
                </div>
              </div>

              <div class="rp-body">
                @if (emailBodyIsHtml()) {
                  <div class="email-body-html" [innerHTML]="emailBodySafe()"></div>
                } @else {
                  <pre class="email-body-text">{{ openEmail_data()!.body }}</pre>
                }

                @if (replyMode() !== 'none') {
                  <div class="inline-composer">
                    <div class="composer-header">
                      <span>{{ replyMode() === 'forward' ? 'Forward' : 'Reply' }}</span>
                      <button class="btn-icon" (click)="replyMode.set('none')">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div class="composer-to">
                      <span class="composer-label">To</span>
                      <input class="composer-field" [(ngModel)]="replyTo" placeholder="recipient@example.com" />
                    </div>
                    <textarea class="composer-body" [(ngModel)]="replyBody" rows="6" placeholder="Write your message…"></textarea>
                    <div class="composer-footer">
                      <button class="btn-primary" (click)="sendReply()" [disabled]="sendingReply()">
                        {{ sendingReply() ? 'Sending…' : 'Send' }}
                      </button>
                      @if (replyError()) {
                        <span class="error-text">{{ replyError() }}</span>
                      }
                    </div>
                  </div>
                }
              </div>

              @if (replyMode() === 'none') {
                <div class="rp-footer">
                  <button class="reply-chip primary" (click)="replyMode.set('reply')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                    Reply <kbd>R</kbd>
                  </button>
                  <button class="reply-chip" (click)="replyMode.set('replyAll')">Reply all</button>
                  <button class="reply-chip" (click)="startForward()">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>
                    Forward <kbd>F</kbd>
                  </button>
                  <div class="rp-footer-hint">E archive · # delete</div>
                </div>
              }
            }
          </div>
        }
      </div>

    }
  </main>

  <!-- Compose modal — rendered outside phase block so it works from any view -->
  @if (composeOpen()) {
    <div class="compose-backdrop" (click)="composeOpen.set(false)"></div>
    <div class="compose-modal">
      <div class="compose-header">
        <span class="compose-title">New message</span>
        <button class="btn-icon" (click)="composeOpen.set(false)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="compose-fields">
        <div class="field-row">
          <span class="field-label">From</span>
          <select class="field-select" [(ngModel)]="composeFrom">
            @for (a of accounts(); track a.id) {
              <option [value]="a.id">{{ a.email }}</option>
            }
          </select>
        </div>
        <div class="field-row">
          <span class="field-label">To</span>
          <input class="field-input" [(ngModel)]="composeTo" placeholder="someone@example.com (comma-separated)" />
        </div>
        <div class="field-row">
          <span class="field-label">Cc</span>
          <input class="field-input" [(ngModel)]="composeCc" placeholder="optional" />
        </div>
        <div class="field-row">
          <span class="field-label">Subject</span>
          <input class="field-input" [(ngModel)]="composeSubject" placeholder="What's this about?" />
        </div>
      </div>
      <textarea class="compose-body" [(ngModel)]="composeBody" placeholder="Write your message…"></textarea>
      @if (composeError()) {
        <div class="error-text px-16">{{ composeError() }}</div>
      }
      <div class="compose-footer">
        <button class="btn-primary" (click)="doSend()" [disabled]="composeSending()">
          {{ composeSending() ? 'Sending…' : 'Send' }}
        </button>
        <button class="btn-ghost" (click)="composeOpen.set(false)">Discard</button>
      </div>
    </div>
  }

  <!-- QuickClean modal — rendered outside phase block -->
  @if (quickCleanOpen()) {
    <div class="compose-backdrop" (click)="quickCleanOpen.set(false)"></div>
    <div class="quickclean-modal">
      <div class="compose-header">
        <span class="compose-title">QuickClean</span>
        <button class="btn-icon" (click)="quickCleanOpen.set(false)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <p class="muted-text px-16">Delete all emails from these top senders at once.</p>
      @if (qcLoading()) {
        <div class="state-center"><div class="spinner"></div></div>
      } @else if (qcCandidates().length === 0) {
        <div class="state-center"><span class="muted-text">Inbox is clean!</span></div>
      } @else {
        <div class="qc-list">
          @for (c of qcCandidates(); track c.sender_email) {
            <div class="qc-row">
              <div class="qc-info">
                <div class="qc-sender">{{ c.sender_name || c.sender_email }}</div>
                <div class="qc-sub muted-text">{{ c.cnt }} emails · {{ c.latest_subject }}</div>
              </div>
              <button class="btn-action red" (click)="qcDeleteAll(c.sender_email)">Delete all</button>
            </div>
          }
        </div>
      }
    </div>
  }
</div>

<!-- Reusable email row template -->
<ng-template #emailRowContent let-email="email">
  <div class="row-check" (click)="$event.stopPropagation(); toggleSelect(email.id)">
    <div class="checkbox" [class.checked]="selected().includes(email.id)">
      @if (selected().includes(email.id)) {
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      }
    </div>
  </div>
  <div class="row-unread-dot">
    @if (!email.is_read) {
      <div class="unread-dot"></div>
    }
  </div>
  <div class="row-sender">
    <div class="sender-avatar" [style.background]="accountColor(email.account_id)" [style.color]="'#fff'">
      {{ (accountInitial(email.account_id)) }}
    </div>
    <span class="sender-name" [class.bold]="!email.is_read">{{ email.sender_name || email.sender_email }}</span>
  </div>
  <div class="row-content">
    <span class="row-subject" [class.bold]="!email.is_read">{{ email.subject }}</span>
    <span class="row-sep">—</span>
    <span class="row-preview">{{ email.body?.slice(0, 100) }}</span>
  </div>
  <div class="row-meta">
    <span class="row-date">{{ formatDate(email.date) }}</span>
    <span class="cat-badge sm" [style.color]="catColor(email.category)" [style.background]="catColor(email.category) + '1f'">
      {{ catLabel(email.category) }}
    </span>
  </div>
</ng-template>
  `,
  styles: [`
    :host { display: flex; flex: 1; min-width: 0; min-height: 0; overflow: hidden; }

    .email-root { display: flex; flex: 1; min-width: 0; min-height: 0; background: var(--bg); }

    /* Rail */
    .email-rail {
      width: 52px; flex-shrink: 0;
      background: var(--rail); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; align-items: center; padding: 10px 0; gap: 4px;
    }
    .rail-compose {
      width: 28px; height: 28px; border-radius: 6px;
      background: rgba(37,99,235,0.15); border: 1px solid rgba(37,99,235,0.3);
      color: var(--accent2); display: flex; align-items: center; justify-content: center;
      margin-bottom: 10px;
    }
    .rail-accounts { display: flex; flex-direction: column; gap: 4px; align-items: center; }
    .rail-account-dot {
      width: 26px; height: 26px; border-radius: 50%; color: #fff;
      font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center;
      border: 2px solid transparent; outline: none; transition: border-color .12s;
    }
    .rail-account-dot.active { border-color: var(--text); outline: 1.5px solid var(--accent); outline-offset: 1px; }
    .rail-add-account {
      width: 26px; height: 26px; border-radius: 50%;
      background: transparent; border: 1px dashed var(--border); color: var(--muted);
      display: flex; align-items: center; justify-content: center;
    }
    .rail-divider { width: 24px; height: 1px; background: var(--border); margin: 10px 0; }
    .rail-nav { display: flex; flex-direction: column; gap: 2px; align-items: center; }
    .rail-nav-btn {
      width: 32px; height: 32px; border-radius: 5px; background: transparent; border: none;
      color: var(--muted); display: flex; align-items: center; justify-content: center;
      transition: background .1s, color .1s;
    }
    .rail-nav-btn:hover { background: var(--hover); color: var(--text); }
    .rail-nav-btn.active { background: rgba(37,99,235,0.15); color: var(--accent2); }
    .rail-spacer { flex: 1; }
    .rail-quickclean { margin-bottom: 6px; }

    /* Main */
    .email-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }

    /* States */
    .state-center { flex: 1; display: flex; align-items: center; justify-content: center; }
    .muted-text { color: var(--muted); font-size: 13px; }

    /* Onboarding */
    .onboarding-wrap {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 32px; background: var(--bg);
    }
    .onboarding-card { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
    .onboarding-logo {
      width: 24px; height: 24px; border-radius: 5px; background: var(--accent);
      display: flex; align-items: center; justify-content: center;
    }
    .onboarding-app-name { font-size: 15px; font-weight: 600; color: var(--text); letter-spacing: -0.2px; }
    .onboarding-title { font-size: 18px; font-weight: 600; color: var(--text); margin: 0 0 6px; text-align: center; }
    .onboarding-desc { font-size: 13px; color: var(--muted); margin: 0 0 24px; text-align: center; max-width: 360px; line-height: 1.5; }
    .onboarding-btns { display: flex; flex-direction: column; gap: 8px; width: 360px; }
    .provider-btn {
      display: flex; align-items: center; gap: 12px; padding: 12px 14px;
      background: var(--panel); border: 1px solid var(--border); border-radius: 6px;
      color: var(--text); font-size: 13px; font-weight: 500; width: 100%;
      transition: border-color .12s, background .12s;
    }
    .provider-btn:hover { background: var(--hover); border-color: var(--accent); }
    .provider-btn.dashed { border-style: dashed; color: var(--dim); }
    .provider-logo { width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
    .gmail-logo { background: #EA4335; color: #fff; }
    .outlook-logo { background: #0078D4; color: #fff; }
    .chevron { margin-left: auto; }
    .error-banner { margin-bottom: 16px; padding: 8px 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 4px; color: #fca5a5; font-size: 12px; width: 360px; }
    .creds-form { width: 360px; display: flex; flex-direction: column; gap: 10px; }
    .creds-row { display: flex; flex-direction: column; gap: 4px; }
    .creds-label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.3px; }
    .creds-input {
      width: 100%; padding: 8px 10px; background: var(--panel); border: 1px solid var(--border);
      border-radius: 6px; color: var(--text); font-size: 13px; font-family: var(--mono); outline: none;
      transition: border-color .12s;
    }
    .creds-input:focus { border-color: var(--accent); }
    .creds-hint { padding-top: 4px; }
    .creds-link { font-size: 12px; color: var(--accent2); cursor: pointer; text-decoration: none; }
    .creds-link:hover { text-decoration: underline; }
    code { font-family: var(--mono); font-size: 11.5px; background: rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; }
    .connect-status { border: 1px solid var(--border); border-radius: 6px; padding: 20px; display: flex; align-items: center; gap: 12px; background: var(--hover); width: 360px; }
    .connect-label { font-size: 13px; color: var(--text); font-weight: 500; }
    .connect-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .connected-account { border: 1px solid var(--border); border-radius: 6px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; background: var(--hover); width: 360px; margin-bottom: 8px; }
    .acct-avatar { width: 28px; height: 28px; border-radius: 50%; color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .acct-email { font-size: 13px; color: var(--text); font-weight: 500; }
    .acct-status { font-size: 11px; color: #22c55e; }
    .mt-8 { margin-top: 8px; }
    .mt-12 { margin-top: 12px; }

    /* Topbar */
    .email-topbar {
      height: 44px; flex-shrink: 0; border-bottom: 1px solid var(--border);
      background: var(--panel); display: flex; align-items: center; gap: 10px; padding: 0 14px;
    }
    .search-input {
      flex: 1; height: 28px; padding: 0 10px; border-radius: 6px;
      background: var(--bg); border: 1px solid var(--border); color: var(--text); font-size: 13px;
      font-family: inherit; outline: none;
    }
    .search-input:focus { border-color: var(--accent); }
    .topbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .sync-status { font-size: 11px; color: var(--muted); font-family: var(--mono); }

    /* Email body */
    .email-body { flex: 1; display: flex; position: relative; min-height: 0; overflow: hidden; }
    .email-list-panel { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
    .list-header {
      height: 40px; flex-shrink: 0; padding: 0 14px; display: flex; align-items: center; gap: 8px;
      border-bottom: 1px solid var(--border); background: var(--panel-2);
    }
    .list-title { font-size: 13px; font-weight: 600; color: var(--text); }
    .list-count { font-size: 11px; font-weight: 500; padding: 2px 7px; border-radius: 4px; background: var(--hover); color: var(--dim); font-variant-numeric: tabular-nums; }
    .ml-auto { margin-left: auto; }
    .ml-8 { margin-left: 8px; }
    .px-16 { padding: 8px 16px; }
    .bulk-actions { display: flex; gap: 6px; }

    /* Filter chips */
    .filter-chips { display: flex; gap: 4px; padding: 6px 12px; flex-shrink: 0; border-bottom: 1px solid var(--border); overflow-x: auto; }
    .chip {
      padding: 3px 10px; border-radius: 12px; border: 1px solid var(--border);
      background: transparent; color: var(--muted); font-size: 11px; font-weight: 500;
      white-space: nowrap; transition: background .1s, color .1s, border-color .1s;
    }
    .chip.active, .chip:hover { background: rgba(37,99,235,0.1); border-color: var(--accent); color: var(--accent2); }

    /* Email rows */
    .email-scroll { flex: 1; overflow-y: auto; min-height: 0; }
    .email-row {
      display: grid;
      grid-template-columns: 28px 16px 180px 1fr 140px;
      align-items: center; gap: 10px;
      padding: 10px 14px 10px 10px;
      border-bottom: 1px solid rgba(35,42,58,0.6);
      border-left: 2px solid transparent;
      cursor: pointer; transition: background .1s;
    }
    .email-row:hover { background: var(--hover); }
    .email-row.open { background: rgba(37,99,235,0.06); border-left-color: var(--accent); }
    .email-row.selected { background: rgba(37,99,235,0.06); border-left-color: var(--accent); }

    .row-check { display: flex; align-items: center; justify-content: center; }
    .checkbox {
      width: 15px; height: 15px; border-radius: 3px;
      border: 1px solid var(--muted); background: transparent;
      display: flex; align-items: center; justify-content: center;
      transition: background .1s, border-color .1s;
    }
    .checkbox.checked { background: var(--accent); border-color: var(--accent); }
    .row-unread-dot { display: flex; align-items: center; justify-content: center; }
    .unread-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
    .row-sender { display: flex; align-items: center; gap: 7px; min-width: 0; }
    .sender-avatar {
      width: 16px; height: 16px; border-radius: 50%; font-size: 9px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .sender-name { font-size: 13px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sender-name.bold { font-weight: 600; color: var(--text); }
    .row-content { display: flex; align-items: baseline; gap: 6px; min-width: 0; overflow: hidden; }
    .row-subject { font-size: 13px; color: var(--dim); white-space: nowrap; flex-shrink: 0; max-width: 40%; overflow: hidden; text-overflow: ellipsis; }
    .row-subject.bold { font-weight: 500; color: var(--text); }
    .row-sep { color: var(--muted); flex-shrink: 0; }
    .row-preview { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
    .row-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .row-date { font-size: 11px; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }

    /* Category badge */
    .cat-badge {
      display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 4px;
      font-size: 11px; font-weight: 500; white-space: nowrap; line-height: 1.2;
    }
    .cat-badge.sm { padding: 1px 5px; font-size: 10px; }

    /* Reading pane */
    .rp-backdrop { position: absolute; inset: 0; background: rgba(8,8,10,0.5); z-index: 10; }
    .reading-pane {
      position: absolute; top: 0; bottom: 0; right: 0;
      width: 60%; min-width: 520px;
      background: var(--panel); border-left: 1px solid var(--border);
      display: flex; flex-direction: column; z-index: 11;
      animation: slideInRight .18s ease-out;
    }
    .rp-header { padding: 14px 18px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .rp-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .rp-header-left { display: flex; align-items: center; gap: 8px; }
    .rp-actions { display: flex; gap: 5px; }
    .rp-subject { margin: 0 0 10px; font-size: 17px; font-weight: 600; color: var(--text); letter-spacing: -0.2px; line-height: 1.35; }
    .rp-meta { display: flex; align-items: center; gap: 10px; }
    .rp-avatar {
      width: 28px; height: 28px; border-radius: 50%; font-size: 12px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      border: 1px solid currentColor;
    }
    .rp-sender-info { display: flex; flex-direction: column; line-height: 1.3; }
    .rp-sender-name { font-size: 13px; color: var(--text); font-weight: 500; }
    .rp-sender-email { font-size: 13px; color: var(--muted); }
    .rp-to { font-size: 12px; color: var(--muted); }
    .rp-body { flex: 1; overflow-y: auto; min-height: 0; padding: 20px 22px 24px; }
    .email-body-text {
      margin: 0; font-family: inherit; font-size: 14px; line-height: 1.65;
      color: var(--dim); white-space: pre-wrap; word-break: break-word;
    }
    .email-body-html {
      font-size: 14px; line-height: 1.65; color: var(--dim); word-break: break-word;
    }
    .email-body-html :where(a) { color: var(--accent2); }
    .email-body-html :where(img) { max-width: 100%; height: auto; border-radius: 4px; }
    .email-body-html :where(table) { border-collapse: collapse; width: 100%; max-width: 100%; }
    .email-body-html :where(td, th) { padding: 4px 8px; border: 1px solid var(--border); font-size: 13px; }
    .email-body-html :where(blockquote) { border-left: 3px solid var(--border); margin: 8px 0; padding-left: 12px; color: var(--muted); }
    .email-body-html :where(pre, code) { font-family: var(--mono); font-size: 12px; background: var(--bg); border-radius: 4px; padding: 2px 6px; }
    .rp-footer {
      padding: 12px 18px; border-top: 1px solid var(--border);
      display: flex; gap: 8px; align-items: center; background: var(--panel); flex-shrink: 0;
    }
    .rp-footer-hint { margin-left: auto; font-size: 11px; color: var(--muted); font-family: var(--mono); }
    .reply-chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
      background: transparent; border: 1px solid var(--border); border-radius: 4px;
      color: var(--text); font-size: 12px; font-weight: 500; transition: background .1s;
    }
    .reply-chip:hover { background: var(--hover); }
    .reply-chip.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .reply-chip.primary:hover { filter: brightness(0.9); }
    .reply-chip kbd {
      padding: 0 4px; border: 1px solid rgba(255,255,255,0.2); border-radius: 3px;
      font-family: var(--mono); font-size: 10px; opacity: 0.85;
    }

    /* Inline composer */
    .inline-composer { border-top: 1px solid var(--border); margin-top: 20px; }
    .composer-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 8px; font-size: 12px; font-weight: 600; color: var(--text); }
    .composer-to { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); }
    .composer-label { font-size: 11px; color: var(--muted); width: 28px; text-transform: uppercase; letter-spacing: 0.3px; }
    .composer-field { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 13px; font-family: inherit; }
    .composer-body {
      width: 100%; margin-top: 10px; padding: 8px 0;
      background: transparent; border: none; outline: none; resize: none;
      color: var(--dim); font-size: 13px; font-family: inherit; line-height: 1.6;
    }
    .composer-footer { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
    .error-text { color: #fca5a5; font-size: 12px; }

    /* Snooze popover */
    .snooze-popover {
      position: absolute; top: calc(100% + 6px); right: 0; width: 280px;
      background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
      box-shadow: 0 12px 32px -8px rgba(0,0,0,0.7); padding: 6px; z-index: 30;
      animation: popIn .12s ease-out;
    }
    .snooze-title { padding: 6px 8px 8px; border-bottom: 1px solid var(--border); margin-bottom: 4px; font-size: 12px; font-weight: 500; color: var(--text); }
    .snooze-row {
      display: flex; align-items: center; justify-content: space-between; width: 100%;
      padding: 7px 8px; background: transparent; border: none; border-radius: 4px;
      color: var(--text); font-size: 12px; font-weight: 500; text-align: left; transition: background .1s;
    }
    .snooze-row:hover { background: var(--hover); }
    .snooze-custom { margin-top: 4px; padding-top: 8px; border-top: 1px solid var(--border); }
    .snooze-custom-label { padding: 0 8px 6px; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.3px; }
    .snooze-custom-row { display: flex; gap: 6px; padding: 0 8px 8px; }
    .snooze-input {
      flex: 1; padding: 5px 7px; background: var(--bg); border: 1px solid var(--border);
      border-radius: 4px; color: var(--text); font-size: 12px; font-family: inherit;
      color-scheme: dark;
    }
    .snooze-btn { margin: 0 8px 4px; width: calc(100% - 16px); }

    /* Compose modal */
    .compose-backdrop { position: fixed; inset: 0; background: rgba(8,8,10,0.65); backdrop-filter: blur(2px); z-index: 100; animation: fadeIn .14s; }
    .compose-modal {
      position: fixed; top: 7%; left: 50%; transform: translateX(-50%);
      width: min(720px, 92vw); max-height: 86vh;
      background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
      box-shadow: 0 24px 64px -12px rgba(0,0,0,0.7);
      display: flex; flex-direction: column; z-index: 101; overflow: hidden;
      animation: slideUp .16s ease-out;
    }
    .compose-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--panel-2); flex-shrink: 0; }
    .compose-title { font-size: 13px; font-weight: 600; color: var(--text); }
    .compose-fields { padding: 4px 16px 0; flex-shrink: 0; }
    .field-row { display: grid; grid-template-columns: 64px 1fr; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); min-height: 36px; }
    .field-label { font-size: 11px; color: var(--muted); font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase; }
    .field-input { flex: 1; padding: 0; background: transparent; border: none; outline: none; color: var(--text); font-size: 13px; font-family: inherit; }
    .field-select { background: transparent; border: none; outline: none; color: var(--text); font-size: 13px; font-family: inherit; }
    .compose-body {
      flex: 1; padding: 14px 16px; min-height: 200px;
      background: transparent; border: none; outline: none; resize: none;
      color: var(--dim); font-size: 14px; line-height: 1.65; font-family: inherit;
    }
    .compose-footer { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-top: 1px solid var(--border); background: var(--panel-2); flex-shrink: 0; }

    /* QuickClean */
    .quickclean-modal {
      position: fixed; top: 10%; left: 50%; transform: translateX(-50%);
      width: min(560px, 92vw); max-height: 80vh;
      background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
      display: flex; flex-direction: column; z-index: 101; overflow: hidden;
      animation: slideUp .16s ease-out;
    }
    .qc-list { flex: 1; overflow-y: auto; padding: 8px; }
    .qc-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 8px; border-radius: 6px; transition: background .1s; }
    .qc-row:hover { background: var(--hover); }
    .qc-info { flex: 1; min-width: 0; }
    .qc-sender { font-size: 13px; font-weight: 500; color: var(--text); }
    .qc-sub { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Buttons */
    .btn-primary {
      padding: 8px 18px; border-radius: 7px; border: none;
      background: var(--accent); color: #fff; font-size: 13px; font-weight: 500;
      transition: filter .1s;
    }
    .btn-primary:hover { filter: brightness(1.1); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      padding: 8px 16px; border-radius: 7px; border: 1px solid var(--border);
      background: transparent; color: var(--dim); font-size: 13px; font-weight: 500;
    }
    .btn-ghost {
      padding: 4px 10px; border-radius: 5px; border: none;
      background: transparent; color: var(--muted); font-size: 12px; font-weight: 500; transition: color .1s;
    }
    .btn-ghost:hover { color: var(--text); }
    .btn-icon {
      width: 26px; height: 26px; border-radius: 4px;
      background: transparent; border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center; color: var(--muted);
      transition: color .1s, background .1s;
    }
    .btn-icon:hover { color: var(--text); background: var(--hover); }
    .btn-xs {
      padding: 2px 8px; font-size: 11px; border-radius: 3px;
      background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.3); color: var(--accent2); font-weight: 500;
    }
    .btn-action {
      padding: 4px 8px; font-size: 11.5px; font-weight: 500; border-radius: 4px;
      border: 1px solid var(--border); background: transparent; color: var(--dim);
      transition: background .1s, border-color .1s;
    }
    .btn-action:hover { background: var(--hover); border-color: var(--muted); }
    .btn-action.red { color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .btn-action.red:hover { background: rgba(239,68,68,0.1); }
    .btn-action.red-hover:hover { color: #ef4444; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.1); }
    .btn-action.starred { color: #F59E0B; }
    .btn-action.ghost { color: var(--muted); }

    /* Spinner */
    .spinner {
      width: 18px; height: 18px; border-radius: 50%;
      border: 2px solid var(--border); border-top-color: var(--accent);
      animation: spin 0.7s linear infinite;
    }

    @keyframes slideInRight {
      from { transform: translateX(24px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateX(-50%) translateY(10px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `],
})
export class EmailComponent implements OnInit, OnDestroy {
  private emailService = inject(EmailService);
  private sanitizer = inject(DomSanitizer);

  // ─── State ──────────────────────────────────────────────────────────────────
  phase = signal<Phase>('loading');
  accounts = signal<AccountRecord[]>([]);
  activeAccount = signal<string | null>(null);
  activeNav = signal<EmailNav>('inbox');
  filter = signal<EmailCategory>('all');
  selected = signal<string[]>([]);

  inboxEmails = signal<EmailRecord[]>([]);
  otherEmails = signal<EmailRecord[]>([]);
  searchResults = signal<EmailRecord[]>([]);
  listLoading = signal(false);

  openEmailId = signal<string | null>(null);
  openEmail_data = signal<EmailRecord | null>(null);
  rpLoading = signal(false);
  replyMode = signal<ReplyMode>('none');
  replyTo = '';
  replyBody = '';
  sendingReply = signal(false);
  replyError = signal<string | null>(null);
  snoozeOpen = signal(false);
  customSnoozeDate = '';
  customSnoozeTime = '09:00';

  composeOpen = signal(false);
  composeFrom = '';
  composeTo = '';
  composeCc = '';
  composeSubject = '';
  composeBody = '';
  composeSending = signal(false);
  composeError = signal<string | null>(null);

  quickCleanOpen = signal(false);
  qcCandidates = signal<{ sender_email: string; sender_name: string; cnt: number; latest_subject: string }[]>([]);
  qcLoading = signal(false);

  syncStatus = signal('');

  onboardingPhase = signal<'start' | 'loading' | 'added' | 'setup-gmail' | 'setup-outlook'>('start');
  onboardingError = signal<string | null>(null);
  pendingProvider = signal<'gmail' | 'outlook' | null>(null);
  connectedAccount = signal<AccountRecord | null>(null);
  setupClientId = '';
  setupClientSecret = '';
  setupSaving = signal(false);

  searchQuery = '';
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private syncUnsubscribe?: () => void;

  readonly filterChips = [
    { id: 'all' as EmailCategory, label: 'All' },
    { id: 'important' as EmailCategory, label: 'Important' },
    { id: 'newsletter' as EmailCategory, label: 'Newsletter' },
    { id: 'receipt' as EmailCategory, label: 'Receipt' },
    { id: 'spam' as EmailCategory, label: 'Spam' },
    { id: 'other' as EmailCategory, label: 'Other' },
  ];

  readonly snoozePresets = getSnoozePresets();
  readonly formatDate = formatDate;

  filteredEmails = computed(() =>
    this.inboxEmails().filter(e => this.filter() === 'all' || e.category === this.filter())
  );

  navLabel = computed(() => {
    const map: Record<EmailNav, string> = { inbox: 'Inbox', starred: 'Starred', sent: 'Sent', archived: 'Archive' };
    return map[this.activeNav()];
  });

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await this.loadAccounts();
    this.syncUnsubscribe = this.emailService.onSyncTick(() => {
      this.syncStatus.set('Synced just now');
      this.refreshCurrentView();
    });
  }

  ngOnDestroy(): void {
    this.syncUnsubscribe?.();
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
  }

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

    if (e.key === 'Escape') {
      if (this.snoozeOpen()) { this.snoozeOpen.set(false); return; }
      if (this.replyMode() !== 'none') { this.replyMode.set('none'); return; }
      if (this.openEmailId()) { this.closeEmail(); return; }
      if (this.composeOpen()) { this.composeOpen.set(false); return; }
      if (this.quickCleanOpen()) { this.quickCleanOpen.set(false); return; }
      return;
    }

    if (inInput) return;

    if (e.key === 'c' && !this.composeOpen()) { this.composeOpen.set(true); return; }
    if (e.key === 'r' && this.openEmailId() && this.replyMode() === 'none') { this.replyMode.set('reply'); return; }
    if (e.key === 'f' && this.openEmailId() && this.replyMode() === 'none') { this.startForward(); return; }
    if (e.key === 'e' && this.selected().length > 0) { this.archiveSelected(); return; }
    if (e.key === '#' && this.selected().length > 0) { this.deleteSelected(); return; }
    if (e.key === 'e' && this.openEmailId()) { this.rpArchive(); return; }
    if (e.key === '#' && this.openEmailId()) { this.rpDelete(); return; }
  }

  // ─── Accounts & phase ────────────────────────────────────────────────────────
  async loadAccounts(): Promise<void> {
    try {
      const accts = await this.emailService.accountsList();
      this.accounts.set(accts);
      if (accts.length === 0) {
        this.phase.set('onboarding');
      } else {
        this.phase.set('app');
        if (!this.activeAccount() && accts.length > 0) {
          this.activeAccount.set(accts[0].id);
          this.composeFrom = accts[0].id;
        }
        await this.loadInbox();
      }
    } catch {
      this.phase.set('onboarding');
    }
  }

  showOnboarding(): void {
    this.onboardingPhase.set('start');
    this.onboardingError.set(null);
    this.phase.set('onboarding');
  }

  async startConnect(provider: 'gmail' | 'outlook'): Promise<void> {
    this.onboardingError.set(null);
    this.pendingProvider.set(provider);
    try {
      const creds = await this.emailService.settingsGetOauthCreds();
      const hasCreds = provider === 'gmail'
        ? !!(creds.gmailClientId && creds.gmailClientSecret)
        : !!(creds.outlookClientId);
      if (!hasCreds) {
        this.setupClientId = provider === 'gmail' ? (creds.gmailClientId || '') : (creds.outlookClientId || '');
        this.setupClientSecret = provider === 'gmail' ? (creds.gmailClientSecret || '') : '';
        this.onboardingPhase.set(provider === 'gmail' ? 'setup-gmail' : 'setup-outlook');
        return;
      }
    } catch {}
    await this.connectAccount(provider);
  }

  async saveCredsAndConnect(): Promise<void> {
    const provider = this.pendingProvider();
    if (!provider || !this.setupClientId.trim()) return;
    this.setupSaving.set(true);
    this.onboardingError.set(null);
    try {
      if (provider === 'gmail') {
        await this.emailService.settingsSetOauthCreds({
          gmailClientId: this.setupClientId.trim(),
          gmailClientSecret: this.setupClientSecret.trim(),
        });
      } else {
        await this.emailService.settingsSetOauthCreds({
          outlookClientId: this.setupClientId.trim(),
        });
      }
    } catch (err: any) {
      this.onboardingError.set(err.message || 'Failed to save credentials');
      this.setupSaving.set(false);
      return;
    }
    this.setupSaving.set(false);
    await this.connectAccount(provider);
  }

  async connectAccount(provider: 'gmail' | 'outlook'): Promise<void> {
    this.pendingProvider.set(provider);
    this.onboardingPhase.set('loading');
    this.onboardingError.set(null);
    try {
      const account = provider === 'gmail'
        ? await this.emailService.accountsAddGmail()
        : await this.emailService.accountsAddOutlook();
      this.connectedAccount.set(account);
      this.onboardingPhase.set('added');
      const accts = await this.emailService.accountsList();
      this.accounts.set(accts);
      if (!this.activeAccount()) {
        this.activeAccount.set(account.id);
        this.composeFrom = account.id;
      }
    } catch (err: any) {
      this.onboardingError.set(err.message || 'OAuth failed');
      this.onboardingPhase.set('start');
    }
    this.pendingProvider.set(null);
  }

  openExternal(url: string): void {
    window.open(url, '_blank');
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────
  setNav(nav: EmailNav): void {
    this.activeNav.set(nav);
    this.openEmailId.set(null);
    this.selected.set([]);
    this.refreshCurrentView();
  }

  async refreshCurrentView(): Promise<void> {
    if (this.phase() !== 'app') return;
    if (this.activeNav() === 'inbox') {
      await this.loadInbox();
    } else {
      await this.loadOtherView();
    }
  }

  async loadInbox(): Promise<void> {
    this.listLoading.set(true);
    try {
      const emails = await this.emailService.listInbox();
      this.inboxEmails.set(emails);
    } finally {
      this.listLoading.set(false);
    }
  }

  async loadOtherView(): Promise<void> {
    this.listLoading.set(true);
    try {
      let emails: EmailRecord[];
      if (this.activeNav() === 'starred') emails = await this.emailService.listStarred();
      else if (this.activeNav() === 'sent') emails = await this.emailService.listSent();
      else emails = await this.emailService.listArchived();
      this.otherEmails.set(emails);
    } finally {
      this.listLoading.set(false);
    }
  }

  // ─── Search ──────────────────────────────────────────────────────────────────
  onSearchInput(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(async () => {
      const q = this.searchQuery.trim();
      if (!q) { this.searchResults.set([]); return; }
      this.listLoading.set(true);
      try {
        const results = await this.emailService.search(q);
        this.searchResults.set(results);
      } finally {
        this.listLoading.set(false);
      }
    }, 250);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  // ─── Email open/close ────────────────────────────────────────────────────────
  async openEmail(id: string): Promise<void> {
    this.openEmailId.set(id);
    this.replyMode.set('none');
    this.replyBody = '';
    this.replyTo = '';
    this.rpLoading.set(true);
    this.snoozeOpen.set(false);
    try {
      const email = await this.emailService.open(id);
      this.openEmail_data.set(email);
      if (email && !email.is_read) {
        await this.emailService.markRead([id], true);
        this.updateEmailInList(id, { is_read: 1 });
      }
    } finally {
      this.rpLoading.set(false);
    }
  }

  closeEmail(): void {
    this.openEmailId.set(null);
    this.openEmail_data.set(null);
    this.replyMode.set('none');
    this.snoozeOpen.set(false);
  }

  // ─── Reading pane actions ─────────────────────────────────────────────────────
  async rpArchive(): Promise<void> {
    const id = this.openEmailId();
    if (!id) return;
    await this.emailService.archive([id]);
    this.removeEmailFromList(id);
    this.closeEmail();
  }

  async rpDelete(): Promise<void> {
    const id = this.openEmailId();
    if (!id) return;
    await this.emailService.delete([id]);
    this.removeEmailFromList(id);
    this.closeEmail();
  }

  async toggleStar(): Promise<void> {
    const email = this.openEmail_data();
    if (!email) return;
    const newVal = !email.is_starred;
    await this.emailService.star(email.id, newVal);
    this.openEmail_data.set({ ...email, is_starred: newVal ? 1 : 0 });
  }

  async toggleRead(): Promise<void> {
    const email = this.openEmail_data();
    if (!email) return;
    const newRead = !email.is_read;
    await this.emailService.markRead([email.id], newRead);
    this.openEmail_data.set({ ...email, is_read: newRead ? 1 : 0 });
  }

  async rpUnsubscribe(): Promise<void> {
    const id = this.openEmailId();
    if (!id) return;
    await this.emailService.unsubscribe(id);
  }

  async doSnooze(ts: number): Promise<void> {
    const id = this.openEmailId();
    if (!id) return;
    await this.emailService.snooze([id], ts);
    this.snoozeOpen.set(false);
    this.removeEmailFromList(id);
    this.closeEmail();
  }

  async doCustomSnooze(): Promise<void> {
    if (!this.customSnoozeDate) return;
    const ts = new Date(`${this.customSnoozeDate}T${this.customSnoozeTime || '09:00'}`).getTime();
    if (!isNaN(ts)) await this.doSnooze(ts);
  }

  startForward(): void {
    const email = this.openEmail_data();
    if (!email) return;
    this.replyMode.set('forward');
    this.replyTo = '';
    this.replyBody = `\n\n---------- Forwarded message ----------\nFrom: ${email.sender_email}\nSubject: ${email.subject}\n\n${email.body}`;
  }

  async sendReply(): Promise<void> {
    const id = this.openEmailId();
    if (!id) return;
    this.sendingReply.set(true);
    this.replyError.set(null);
    try {
      if (this.replyMode() === 'forward') {
        const toList = this.replyTo.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        await this.emailService.composeForward(id, { body: this.replyBody, to: toList });
      } else {
        const toList = this.replyTo ? this.replyTo.split(/[,;]/).map(s => s.trim()).filter(Boolean) : undefined;
        await this.emailService.composeReply(id, { body: this.replyBody, to: toList });
      }
      this.replyMode.set('none');
      this.replyBody = '';
      this.replyTo = '';
    } catch (err: any) {
      this.replyError.set(err.message || 'Send failed');
    } finally {
      this.sendingReply.set(false);
    }
  }

  // ─── Bulk actions ─────────────────────────────────────────────────────────────
  toggleSelect(id: string): void {
    const sel = this.selected();
    this.selected.set(sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  }

  async archiveSelected(): Promise<void> {
    const ids = this.selected();
    if (!ids.length) return;
    await this.emailService.archive(ids);
    this.inboxEmails.set(this.inboxEmails().filter(e => !ids.includes(e.id)));
    this.selected.set([]);
  }

  async deleteSelected(): Promise<void> {
    const ids = this.selected();
    if (!ids.length) return;
    await this.emailService.delete(ids);
    this.inboxEmails.set(this.inboxEmails().filter(e => !ids.includes(e.id)));
    this.selected.set([]);
  }

  // ─── Compose ─────────────────────────────────────────────────────────────────
  async doSend(): Promise<void> {
    if (!this.composeFrom || !this.composeTo.trim()) return;
    this.composeSending.set(true);
    this.composeError.set(null);
    try {
      const toList = this.composeTo.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      const ccList = this.composeCc ? this.composeCc.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [];
      await this.emailService.composeSend({
        fromAccountId: this.composeFrom,
        to: toList,
        cc: ccList,
        subject: this.composeSubject,
        body: this.composeBody,
      });
      this.composeOpen.set(false);
      this.composeTo = '';
      this.composeCc = '';
      this.composeSubject = '';
      this.composeBody = '';
    } catch (err: any) {
      this.composeError.set(err.message || 'Send failed');
    } finally {
      this.composeSending.set(false);
    }
  }

  // ─── QuickClean ───────────────────────────────────────────────────────────────
  async openQuickClean(): Promise<void> {
    this.quickCleanOpen.set(true);
    this.qcLoading.set(true);
    try {
      const candidates = await this.emailService.quickCleanCandidates();
      this.qcCandidates.set(candidates);
    } finally {
      this.qcLoading.set(false);
    }
  }

  async qcDeleteAll(senderEmail: string): Promise<void> {
    await this.emailService.deleteAllFromSender(senderEmail);
    this.qcCandidates.set(this.qcCandidates().filter(c => c.sender_email !== senderEmail));
    this.inboxEmails.set(this.inboxEmails().filter(e => e.sender_email !== senderEmail));
  }

  // ─── Sync ─────────────────────────────────────────────────────────────────────
  async doSyncNow(): Promise<void> {
    this.syncStatus.set('Syncing…');
    try {
      await this.emailService.syncNow();
      this.syncStatus.set('Synced');
      await this.refreshCurrentView();
    } catch {
      this.syncStatus.set('Sync failed');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  catLabel(cat: string): string { return CATEGORIES[cat]?.label ?? 'Other'; }
  catColor(cat: string): string { return CATEGORIES[cat]?.color ?? '#6b7488'; }
  accountColor(accountId: string): string { return this.accounts().find(a => a.id === accountId)?.color ?? 'var(--accent)'; }
  accountInitial(accountId: string): string {
    const a = this.accounts().find(x => x.id === accountId);
    return (a?.display_name || a?.email || '?')[0]?.toUpperCase() ?? '?';
  }
  rpAcct(): AccountRecord | undefined {
    return this.accounts().find(a => a.id === this.openEmail_data()?.account_id);
  }

  emailBodyIsHtml = computed<boolean>(() => {
    const body = this.openEmail_data()?.body ?? '';
    return /<[a-z][\s\S]*>/i.test(body);
  });

  emailBodySafe = computed<SafeHtml>(() => {
    const body = this.openEmail_data()?.body ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(body);
  });

  private removeEmailFromList(id: string): void {
    this.inboxEmails.set(this.inboxEmails().filter(e => e.id !== id));
    this.otherEmails.set(this.otherEmails().filter(e => e.id !== id));
  }

  private updateEmailInList(id: string, patch: Partial<EmailRecord>): void {
    this.inboxEmails.set(this.inboxEmails().map(e => e.id === id ? { ...e, ...patch } : e));
    this.otherEmails.set(this.otherEmails().map(e => e.id === id ? { ...e, ...patch } : e));
  }
}
