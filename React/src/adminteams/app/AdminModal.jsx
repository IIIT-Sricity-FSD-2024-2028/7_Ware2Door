import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { formatDate, isExpired } from "../utils.js";

const TIER_OPTIONS = [
  ["Starter", "Starter — 100 shipments/month — ₹2,000/mo"],
  ["Growth", "Growth — 500 shipments/month — ₹8,000/mo"],
  ["Business", "Business — 2,000 shipments/month — ₹25,000/mo"],
  ["Enterprise", "Enterprise — 10,000 shipments/month — ₹50,000/mo"],
];
const VEHICLE_TYPES = ["Bike", "Van", "Truck", "Auto"];

function TierSelect({ value, change }) {
  return (
    <label className="form-group">
      <span>Subscription Tier *</span>
      <select
        required
        value={value || "Starter"}
        onChange={(e) => change(e.target.value)}
      >
        {TIER_OPTIONS.map(([tier, label]) => (
          <option key={tier} value={tier}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function VehicleSelect({ value, change }) {
  return (
    <label className="form-group">
      <span>Vehicle Type *</span>
      <select
        required
        value={value || ""}
        onChange={(e) => change(e.target.value)}
      >
        <option value="">Select…</option>
        {VEHICLE_TYPES.map((vehicle) => (
          <option key={vehicle} value={vehicle}>
            {vehicle}
          </option>
        ))}
      </select>
    </label>
  );
}

function NodeSelect({ label, value, nodes, groups, change, disabled }) {
  const availableNodes = nodes.filter((node) =>
    groups.includes(node.type || node._type),
  );

  return (
    <label className="form-group full">
      <span>{label}</span>
      <select
        required
        disabled={disabled}
        value={value || ""}
        onChange={(e) => {
          const node = availableNodes.find((item) => item.id === e.target.value);
          change(node?.id || "", node?.type || node?._type || "");
        }}
      >
        <option value="">
          {label.startsWith("From") ? "Select origin node…" : "Select destination node…"}
        </option>
        {availableNodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  value,
  change,
  type = "text",
  placeholder,
  required = false,
  min,
}) {
  return (
    <label className="form-group">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        required={required}
        min={min}
        onChange={(e) => change(e.target.value)}
      />
    </label>
  );
}

function Form({ kind, value, nodes, change, submit, close }) {
  const [addFiles, setAddFiles] = useState([]);
  if (kind === "extend")
    return (
      <>
        <div className="modal-body">
          <div className="form-grid">
            <Field
              label="New End Date *"
              value={value.endDate}
              change={(v) => change("endDate", v)}
              type="date"
            />
            <Field
              label="Monthly Rate (₹) *"
              value={value.monthlyRate}
              change={(v) => change("monthlyRate", v)}
              type="number"
              placeholder="e.g. 3000"
            />
          </div>
          <p className="modal-hint">
            <Icon name="fa-circle-info" /> This will extend the subscription end
            date and update the monthly billing rate.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit}>
            <Icon name="fa-check" /> Confirm Extension
          </button>
        </div>
      </>
    );
  if (kind === "tier")
    return (
      <>
        <div className="modal-body">
          <TierSelect value={value.tier} change={(v) => change("tier", v)} />
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit}>
            <Icon name="fa-check" /> Update Tier
          </button>
        </div>
      </>
    );
  if (kind === "escalation")
    return (
      <>
        <div className="modal-body">
          <div className="form-grid col-1">
            <label className="form-group">
              <span>Escalation Status</span>
              <select
                value={value.escalationStatus}
                onChange={(e) => change("escalationStatus", e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Reviewing">Under Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </label>
            <Field
              label="Assigned Officer / Team"
              value={value.escalationAssignedTo}
              change={(v) => change("escalationAssignedTo", v)}
              placeholder="e.g. Desk Officer — Priya"
            />
            <label className="form-group">
              <span>Resolution Note</span>
              <textarea
                value={value.resolutionNote || ""}
                placeholder="Describe action taken…"
                onChange={(e) => change("resolutionNote", e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn-emerald" onClick={submit}>
            <Icon name="fa-check" /> Update
          </button>
        </div>
      </>
    );
  if (kind === "edit-driver")
    return (
      <>
        <div className="modal-body">
          <div className="form-grid">
            <Field
              label="Full Name"
              value={value.name}
              change={(v) => change("name", v)}
              required
            />
            <Field
              label="Phone"
              value={value.phone}
              change={(v) => change("phone", v)}
              required
            />
            <Field
              label="License No."
              value={value.licenseNo}
              change={(v) => change("licenseNo", v)}
              required
            />
            <VehicleSelect
              value={value.vehicleType}
              change={(v) => change("vehicleType", v)}
            />
            <Field
              label="Monthly Fee (₹)"
              value={value.monthlyFee || value.monthlyRate}
              change={(v) => change("monthlyFee", v)}
              type="number"
              min="0"
            />
            <Field
              label="Subscription End Date"
              value={value.endDate}
              change={(v) => change("endDate", v)}
              type="date"
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn-purple" onClick={submit}>
            <Icon name="fa-check" /> Save Changes
          </button>
        </div>
      </>
    );
  if (kind === "partner")
    return (
      <form onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <Field
              label="Company / Platform Name *"
              value={value.name}
              change={(v) => change("name", v)}
              placeholder="e.g. Amazon India, Flipkart"
              required
            />
            <Field
              label="Business Email *"
              value={value.email}
              change={(v) => change("email", v)}
              type="email"
              placeholder="api@company.com"
              required
            />
            <Field
              label="Address / HQ"
              value={value.address}
              change={(v) => change("address", v)}
              placeholder="City or HQ address"
            />
            <Field
              label="Contact Person Name"
              value={value.contactName}
              change={(v) => change("contactName", v)}
              placeholder="John Doe"
            />
            <Field
              label="Contact Phone"
              value={value.contactPhone}
              change={(v) => change("contactPhone", v)}
              placeholder="+91 98XXXXXXXX"
            />
            <TierSelect value={value.tier} change={(v) => change("tier", v)} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn-primary">
            <Icon name="fa-plus" /> Add &amp; Generate API Key
          </button>
        </div>
      </form>
    );
  if (kind === "add-driver")
    return (
      <form onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-section-title">DRIVER DETAILS</div>
            <Field
              label="Full Name *"
              value={value.name}
              change={(v) => change("name", v)}
              placeholder="e.g. Rajan Kumar"
              required
            />
            <Field
              label="Phone *"
              value={value.phone}
              change={(v) => change("phone", v)}
              placeholder="9876543210"
              required
            />
            <Field
              label="License Number *"
              value={value.licenseNo}
              change={(v) => change("licenseNo", v)}
              placeholder="TN01AB1234"
              required
            />
            <VehicleSelect
              value={value.vehicleType}
              change={(v) => change("vehicleType", v)}
            />
            <div className="form-section-title">ROUTE ASSIGNMENT</div>
            <NodeSelect
              label="From Node *"
              value={value.fromNodeId}
              nodes={nodes}
              groups={["WAREHOUSE", "TRANSIT_HUB"]}
              change={(id, type) => {
                change("fromNodeId", id);
                change("fromNodeType", type);
                change("toNodeId", "");
                change("toNodeType", "");
              }}
              origin
            />
            <NodeSelect
              label="To Node *"
              value={value.toNodeId}
              nodes={nodes}
              groups={
                value.fromNodeType === "WAREHOUSE"
                  ? ["TRANSIT_HUB"]
                  : value.fromNodeType === "TRANSIT_HUB"
                    ? ["LOCAL_AGENCY"]
                    : []
              }
              change={(id, type) => {
                change("toNodeId", id);
                change("toNodeType", type);
              }}
            />
            <div className="form-section-title">SUBSCRIPTION</div>
            <Field
              label="Monthly Fee (₹) *"
              value={value.monthlyFee}
              change={(v) => change("monthlyFee", v)}
              type="number"
              placeholder="200"
              required
              min="0"
            />
            <Field
              label="Start Date *"
              value={value.startDate}
              change={(v) => change("startDate", v)}
              type="date"
              required
            />
            <Field
              label="End Date *"
              value={value.endDate}
              change={(v) => change("endDate", v)}
              type="date"
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn-purple">
            <Icon name="fa-check" /> Register Driver
          </button>
        </div>
      </form>
    );
  return (
    <form
      onSubmit={(e) => {
        e.addNodeFiles = addFiles;
        submit(e);
      }}
    >
      <div className="modal-body">
        <div className="form-grid">
          <div className="form-section-title">NODE DETAILS</div>
          <label className="form-group">
            <span>Node Type *</span>
            <select
              required
              value={value.type}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="">Select type…</option>
              <option value="WareHouse">Warehouse</option>
              <option value="TransitHub">Transit Hub</option>
              <option value="LocalAgency">Local Agency</option>
            </select>
          </label>
          <Field
            label="Node Name *"
            value={value.name}
            change={(v) => change("name", v)}
            placeholder="e.g. Mumbai West Warehouse"
          />
          <Field
            label="Email *"
            value={value.email}
            change={(v) => change("email", v)}
            type="email"
            placeholder="node@example.com"
          />
          <Field
            label="Password *"
            value={value.password}
            change={(v) => change("password", v)}
            type="password"
            placeholder="Secure password"
          />
          <Field
            label="Phone *"
            value={value.phone}
            change={(v) => change("phone", v)}
            placeholder="9876543210"
          />
          <Field
            label="City *"
            value={value.city}
            change={(v) => change("city", v)}
            placeholder="e.g. Mumbai"
          />
          <Field
            label="Address *"
            value={value.address}
            change={(v) => change("address", v)}
            placeholder="Full street address"
          />
          <Field
            label="Latitude"
            value={value.lat}
            change={(v) => change("lat", v)}
            placeholder="e.g. 19.0760"
          />
          <Field
            label="Longitude"
            value={value.lng}
            change={(v) => change("lng", v)}
            placeholder="e.g. 72.8777"
          />
          <div className="form-section-title">SUBSCRIPTION</div>
          <Field
            label="Monthly Rate (₹) *"
            value={value.monthlyRate}
            change={(v) => change("monthlyRate", v)}
            type="number"
            placeholder="2000"
          />
          <Field
            label="Start Date *"
            value={value.startDate}
            change={(v) => change("startDate", v)}
            type="date"
          />
          <Field
            label="End Date *"
            value={value.endDate}
            change={(v) => change("endDate", v)}
            type="date"
          />
        </div>
        <div className="node-docs-section">
          <div className="form-section-title">
            LEGAL DOCUMENTS <small>(optional — can also upload later)</small>
          </div>
          <div
            className="file-drop-zone"
            onClick={(e) => e.currentTarget.querySelector("input").click()}
          >
            <Icon name="fa-file-arrow-up" />
            <p>Drag &amp; drop legal documents here</p>
            <span>or click to browse — PDF, JPG, PNG supported</span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setAddFiles([...e.target.files])}
            />
          </div>
          <div className="file-list">
            {addFiles.map((file) => (
              <div className="file-item" key={file.name}>
                <Icon name="fa-file" />
                {file.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={close}>
          Cancel
        </button>
        <button className="btn-primary">
          <Icon name="fa-check" /> Create Node
        </button>
      </div>
    </form>
  );
}

function NodeDetail({ node, open, mutate }) {
  const sub = node.subscription || {};
  const docs = node.legalDocs || node.legalDocuments || node.documents || [];
  const type = node.type || node._type;
  const typeLabel =
    {
      WAREHOUSE: "Warehouse",
      TRANSIT_HUB: "Transit Hub",
      LOCAL_AGENCY: "Local Agency",
    }[type] || type;
  const subLabel = !sub.endDate
    ? "No Subscription"
    : isExpired(sub.endDate)
      ? "Subscription Expired"
      : "Subscription Valid";
  const subClass =
    !sub.endDate || isExpired(sub.endDate) ? "sub-expired" : "sub-active";
  const info = (label, value, full = false) => (
    <div className={`info-item${full ? " full" : ""}`}>
      <span className="info-label">{label}</span>
      <span className="info-val">{value || "—"}</span>
    </div>
  );
  return (
    <div className="modal-body">
      <div className="detail-status-row">
        <span className={`type-badge type--${String(type).toLowerCase()}`}>
          {typeLabel}
        </span>
        <span
          className={`sub-status ${node.isActive === false ? "sub-expired" : "sub-active"}`}
        >
          <Icon name={node.isActive === false ? "fa-ban" : "fa-circle-check"} />{" "}
          {node.isActive === false ? "Inactive" : "Active"}
        </span>
        <span className={`sub-status ${subClass}`}>
          <Icon
            name={
              !sub.endDate
                ? "fa-clock"
                : isExpired(sub.endDate)
                  ? "fa-circle-xmark"
                  : "fa-circle-check"
            }
          />{" "}
          {subLabel}
        </span>
      </div>
      <div className="info-grid">
        {info("Name", node.name)}
        {info("Email", node.email)}
        {info("Phone", node.phone)}
        {info("City", node.city)}
        {info("Address", node.address, true)}
        {info("Subscription Start", formatDate(sub.startDate))}
        {info("Subscription End", formatDate(sub.endDate))}
        {info(
          "Monthly Rate",
          sub.monthlyRate
            ? `₹${Number(sub.monthlyRate).toLocaleString()}/month`
            : "—",
        )}
        {info(
          "Legal Documents",
          docs.length ? `${docs.length} file(s)` : "No documents uploaded",
        )}
      </div>
      <div className="docs-gallery">
        {docs.length ? (
          docs.map((doc) => (
            <div className="doc-chip" key={doc.id || doc.name}>
              <Icon name="fa-file-pdf" />
              <div>
                <span>{doc.name}</span>
                <br />
                <small>{formatDate(doc.uploadedAt)}</small>
              </div>
            </div>
          ))
        ) : (
          <span className="empty-docs">No documents yet.</span>
        )}
      </div>
      <div className="action-strip">
        <button className="btn-primary" onClick={() => open("extend", node)}>
          <Icon name="fa-calendar-plus" /> Extend Subscription
        </button>
        <button className="btn-ghost" onClick={() => open("upload-docs", node)}>
          <Icon name="fa-file-arrow-up" /> Upload Legal Docs
        </button>
        <button
          className={`btn-toggle ${node.isActive === false ? "activate" : "deactivate"}`}
          onClick={() =>
            mutate(
              `/admin-teams/nodes/${node.id}/status`,
              "PUT",
              { isActive: node.isActive === false },
              "Node status updated",
              "subscriptions",
            )
          }
        >
          <Icon name={node.isActive === false ? "fa-check" : "fa-ban"} />{" "}
          {node.isActive === false ? "Activate Node" : "Deactivate Node"}
        </button>
      </div>
    </div>
  );
}

function TicketDetail({ ticket, open, close }) {
  const info = (label, value, full = false) => (
    <div className={`info-item${full ? " full" : ""}`}>
      <span className="info-label">{label}</span>
      <span className="info-val">{value || "—"}</span>
    </div>
  );

  return (
    <>
      <div className="modal-body">
        <div className="info-grid">
          {info("Ticket ID", ticket.ticketId || ticket.id)}
          {info("Tracking ID", ticket.trackingId)}
          {info("Agency", ticket.agencyName || ticket.agency || ticket.agencyId)}
          {info("Agency ID", ticket.agencyId)}
          {info("Category", ticket.category)}
          {info("Subject", ticket.subject, true)}
          {info("Priority", ticket.priority)}
          {info("Ticket Status", ticket.status)}
          {info("Assigned To", ticket.assigned)}
          {info(
            "Created",
            formatDate(ticket.raisedAt || ticket.createdAt || ticket.created),
          )}
          {info("Escalated", formatDate(ticket.escalatedAt))}
          {info(
            "Resolved",
            formatDate(
              ticket.resolvedAt ||
                ((ticket.status === "Resolved" ||
                  ticket.escalationStatus === "Resolved") &&
                  ticket.updatedAt),
            ),
          )}
          {info("Last Updated", formatDate(ticket.updatedAt))}
          {info("Escalation Status", ticket.escalationStatus)}
          {info("Assigned Officer / Team", ticket.escalationAssignedTo)}
          {info("Customer", ticket.custName || ticket.customerName)}
          {info("Customer Phone", ticket.custPhone || ticket.customerPhone)}
          {info("Delivery Address", ticket.custAddr || ticket.customerAddress, true)}
          {info("Issue Description", ticket.issue || ticket.description, true)}
          {info("Escalation Note", ticket.escalationNote || ticket.note, true)}
          {info("Resolution Note", ticket.resolutionNote, true)}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-ghost" onClick={close}>
          Close
        </button>
        <button
          className="btn-primary"
          onClick={() => open("escalation", ticket)}
        >
          <Icon name="fa-pen" /> Update Escalation
        </button>
      </div>
    </>
  );
}

function UploadDocs({ node, uploadDocs, close }) {
  const [files, setFiles] = useState([]);
  return (
    <>
      <div className="modal-body">
        <div
          className="file-drop-zone"
          onClick={() => document.getElementById("legal-upload-input").click()}
        >
          <Icon name="fa-cloud-arrow-up" />
          <p>Click to browse or drag &amp; drop files here</p>
          <span>Supports: PDF, JPG, PNG · Max 10 MB per file</span>
          <input
            id="legal-upload-input"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFiles([...e.target.files])}
          />
        </div>
        <div className="file-list">
          {files.map((file) => (
            <div className="file-item" key={file.name}>
              <Icon name="fa-file" />
              {file.name}
            </div>
          ))}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-ghost" onClick={close}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={() => uploadDocs(node.id, files)}
        >
          <Icon name="fa-upload" /> Upload Files
        </button>
      </div>
    </>
  );
}

function ApiKey({ value, close }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <>
      <div className="modal-body api-key-body">
        <p>
          Share this key with your partner. For security, it cannot be recovered
          once dismissed — only regenerated.
        </p>
        <div className="api-key-value">{value}</div>
        <button className="copy-key" onClick={copy}>
          <Icon name="fa-copy" /> {copied ? "Copied" : "Copy Key"}
        </button>
      </div>
      <div className="modal-footer">
        <button className="btn-primary" onClick={close}>
          Done
        </button>
      </div>
    </>
  );
}

export default function AdminModal({
  kind,
  selected,
  close,
  value,
  nodes,
  change,
  submit,
  open,
  mutate,
  uploadDocs,
}) {
  if (!kind) return null;

  const titles = {
    "node-detail": ["Node Detail", `ID: ${selected?.id || "—"}`],
    extend: ["Extend Subscription", `Node: ${selected?.name || "—"}`],
    "upload-docs": ["Legal Documents", `Node: ${selected?.name || "—"}`],
    "add-node": [
      "Add New Node Partner",
      "Register a new Warehouse, Transit Hub, or Local Agency",
    ],
    "add-driver": [
      "Register New Driver",
      "Add a fleet driver and assign their inter-node route",
    ],
    "edit-driver": ["Edit Driver", `Driver ID: ${selected?.id || "—"}`],
    escalation: ["Update Escalation", `Ticket: ${selected?.ticketId || "—"}`],
    "ticket-detail": [
      "Ticket Details",
      `Ticket: ${selected?.ticketId || selected?.id || "—"}`,
    ],
    partner: ["Add Third Party Partner", ""],
    tier: ["Upgrade/Change Tier", ""],
    "api-key": ["API Key", ""],
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className={`modal ${["node-detail", "add-node", "add-driver", "ticket-detail"].includes(kind) ? "modal-lg" : ""} ${kind === "partner" ? "partner-modal" : ""} ${kind === "tier" ? "tier-modal" : ""} ${kind === "api-key" ? "api-key-modal" : ""}`}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {kind === "partner" && <Icon name="fa-handshake" />}{" "}
              {kind === "tier" && <Icon name="fa-arrow-up-right-dots" />}{" "}
              {kind === "api-key" && <Icon name="fa-key" />} {titles[kind]?.[0]}
            </h3>
            {titles[kind]?.[1] && (
              <p className="modal-subtitle">{titles[kind][1]}</p>
            )}
          </div>
          <button className="modal-close" onClick={close}>
            ×
          </button>
        </div>
        {kind === "node-detail" ? (
          <NodeDetail node={selected} open={open} mutate={mutate} />
        ) : kind === "ticket-detail" ? (
          <TicketDetail ticket={selected} open={open} close={close} />
        ) : kind === "upload-docs" ? (
          <UploadDocs node={selected} uploadDocs={uploadDocs} close={close} />
        ) : kind === "api-key" ? (
          <ApiKey value={selected?.apiKey || "—"} close={close} />
        ) : (
          <Form
            kind={kind}
            value={value}
            nodes={nodes}
            change={change}
            submit={submit}
            close={close}
          />
        )}
      </div>
    </div>
  );
}
