import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

const statusStyles = {
  not_started: "bg-[#f1f3f6] text-[#747b8b]",
  in_progress: "bg-[#fff4df] text-[#a3722e]",
  done: "bg-[#e7f5ef] text-[#348166]"
};

const statusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done"
};

export default function TopicCard({ topic, groupId, onStatusChange, onAssign, isAdmin, currentUserId }) {
  const queryClient = useQueryClient();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState("link");
  const [resourceError, setResourceError] = useState("");
  const [savingResource, setSavingResource] = useState(false);
  const isAssigned = topic.assignedTo?.some(member => (member._id || member) === currentUserId);
  const { data: resources = [], isLoading: resourcesLoading, isError: resourcesError, refetch: refetchResources } = useQuery({
    queryKey: ["resources", groupId, topic._id],
    queryFn: async () => (await api.get(`/resources/${groupId}/topic/${topic._id}`)).data,
    enabled: resourcesOpen
  });

  const addResource = async event => {
    event.preventDefault();
    setResourceError("");
    setSavingResource(true);
    try {
      await api.post(`/resources/${groupId}`, { topicId: topic._id, title: resourceTitle.trim(), url: resourceUrl.trim(), type: resourceType });
      setResourceTitle("");
      setResourceUrl("");
      await queryClient.invalidateQueries({ queryKey: ["resources", groupId, topic._id] });
    } catch (requestError) {
      setResourceError(requestError.response?.data?.message || "We couldn't add that resource.");
    } finally {
      setSavingResource(false);
    }
  };

  const removeResource = async resource => {
    setResourceError("");
    try {
      await api.delete(`/resources/${groupId}/${resource._id}`);
      await queryClient.invalidateQueries({ queryKey: ["resources", groupId, topic._id] });
    } catch (requestError) {
      setResourceError(requestError.response?.data?.message || "We couldn't remove that resource.");
    }
  };

  return (
    <article className="surface flex min-h-[170px] flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(32,39,68,.08)]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold leading-5 text-[#30364a]">{topic.title}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[topic.status] || statusStyles.not_started}`}>{statusLabels[topic.status] || "Not started"}</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#858b99]">
          {topic.assignedTo?.length ? `Assigned to ${topic.assignedTo.map(member => member.name || "Member").join(", ")}` : "Waiting to be assigned"}
        </p>
      </div>
      {(isAssigned || isAdmin) && <div className="mt-5 flex items-center justify-between border-t border-[#f0f1f5] pt-3">
        <label className="text-xs font-semibold text-[#858b99]">
          Progress
          <select aria-label={`Update status for ${topic.title}`} value={topic.status} onChange={event => onStatusChange(topic._id, event.target.value)} className="ml-2 rounded-lg border border-[#e5e7ee] bg-white px-2 py-1.5 text-xs font-semibold capitalize text-[#596174] outline-none focus:border-[#727be1]">
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        {isAdmin && <button type="button" onClick={() => onAssign(topic)} className="focus-ring rounded-lg px-2 py-1.5 text-xs font-bold text-[#5865d8] hover:bg-[#f3f4ff]">Assign people</button>}
      </div>}
      <div className={`${isAssigned || isAdmin ? "" : "mt-5 border-t border-[#f0f1f5] pt-3"}`}>
        <button type="button" aria-expanded={resourcesOpen} onClick={() => setResourcesOpen(open => !open)} className="focus-ring rounded-lg px-2 py-1.5 text-xs font-bold text-[#5865d8] hover:bg-[#f3f4ff]">
          {resourcesOpen ? "Hide resources" : "Resources"}
        </button>
        {resourcesOpen && <div className="mt-2 border-t border-[#f0f1f5] pt-3">
          {resourcesLoading ? <p className="text-xs text-[#858b99]">Loading resources...</p> : resourcesError ? <div role="alert" className="flex items-center justify-between gap-2 text-xs text-[#a14843]"><span>Resources didn't load.</span><button type="button" onClick={() => refetchResources()} className="focus-ring rounded px-2 py-1 font-semibold underline">Retry</button></div> : resources.length ? <ul className="space-y-2">
            {resources.map(resource => <li key={resource._id} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7f8fb] px-3 py-2">
              <span className="min-w-0">
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs font-semibold text-[#5865d8] hover:underline">{resource.title} <span aria-hidden="true">↗</span></a>
                <span className="block truncate text-[10px] text-[#9298a6]">{resource.type === "file" ? "File URL" : "Link"}{resource.uploadedBy?.name ? ` · ${resource.uploadedBy.name}` : ""}</span>
              </span>
              {(isAdmin || (resource.uploadedBy?._id || resource.uploadedBy) === currentUserId) && <button type="button" onClick={() => removeResource(resource)} aria-label={`Remove ${resource.title}`} className="focus-ring shrink-0 rounded px-2 py-1 text-[10px] font-semibold text-[#9a9fac] hover:bg-[#fff1ef] hover:text-[#aa5049]">Remove</button>}
            </li>)}
          </ul> : <p className="text-xs text-[#9298a6]">No resources shared yet.</p>}
          {resourceError && <p role="alert" className="mt-2 text-xs text-[#a14843]">{resourceError}</p>}
          <form onSubmit={addResource} className="mt-3 grid gap-2">
            <label className="sr-only" htmlFor={`resource-title-${topic._id}`}>Resource title</label>
            <input id={`resource-title-${topic._id}`} value={resourceTitle} onChange={event => setResourceTitle(event.target.value)} placeholder="Resource title" maxLength={100} className="field min-h-9 text-xs" required />
            <div className="grid grid-cols-[minmax(0,1fr)_96px_auto] gap-2">
              <label className="sr-only" htmlFor={`resource-url-${topic._id}`}>Resource URL</label>
              <input id={`resource-url-${topic._id}`} type="url" value={resourceUrl} onChange={event => setResourceUrl(event.target.value)} placeholder="Paste URL (https://...)" className="field min-h-9 min-w-0 text-xs" required />
              <label className="sr-only" htmlFor={`resource-type-${topic._id}`}>Resource type</label>
              <select id={`resource-type-${topic._id}`} value={resourceType} onChange={event => setResourceType(event.target.value)} className="field min-h-9 w-[94px] px-2 text-xs">
                <option value="link">Link</option>
                <option value="file">File URL</option>
              </select>
              <button type="submit" className="quiet-button focus-ring min-h-9 px-3 text-xs" disabled={savingResource}>{savingResource ? "..." : "Add"}</button>
            </div>
          </form>
        </div>}
      </div>
    </article>
  );
}
