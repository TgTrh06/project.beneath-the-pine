import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InviteView } from "./InviteView";
import { CirclesView } from "./CirclesView";

let resource: { loading: boolean; error: string; data: unknown; reload: () => Promise<void> };
vi.mock("../../shared/api/useResource", () => ({ useResource: () => resource }));

const props = {
  token: "a".repeat(64),
  onOpen: () => {},
  onDeclined: () => {},
  onCircles: () => {},
};

describe("Circle invitation screen", () => {
  beforeEach(() => { resource = { loading: false, error: "", data: null, reload: async () => {} }; });

  it("shows the limited preview and both explicit choices", () => {
    resource.data = { state: "ready", invite: { circleName: "Nhóm của tôi", inviterName: "Người mời" } };
    const html = renderToStaticMarkup(<InviteView {...props}/>);
    expect(html).toContain("Nhóm của tôi");
    expect(html).toContain("Người tạo link: Người mời");
    expect(html).toContain("Tham gia Circle");
    expect(html).toContain("Không tham gia");
    expect(html).toContain("Danh sách thành viên chỉ hiện sau khi tham gia");
    expect(html).not.toContain(props.token);
  });

  it("removes participation controls when a link is unavailable", () => {
    resource.data = { state: "unavailable" };
    const html = renderToStaticMarkup(<InviteView {...props}/>);
    expect(html).toContain("Link mời này không còn sử dụng được");
    expect(html).toContain("Xem Circle của bạn");
    expect(html).not.toContain("Tham gia Circle");
    expect(html).not.toContain("Không tham gia");
  });

  it("keeps controls hidden while loading and gives failed loads a retry", () => {
    resource.loading = true;
    expect(renderToStaticMarkup(<InviteView {...props}/>)).toContain("Đang kiểm tra lời mời");
    resource.loading = false;
    resource.error = "Không thể kết nối API.";
    const html = renderToStaticMarkup(<InviteView {...props}/>);
    expect(html).toContain("Không thể kết nối API.");
    expect(html).toContain("Thử lại");
    expect(html).not.toContain("Tham gia Circle");
  });

  it("shows a usable Circle list and a clear empty state", () => {
    resource.data = { circles: [] };
    expect(renderToStaticMarkup(<CirclesView onOpen={() => {}} onNotice={() => {}}/>)).toContain("Chưa có Circle");
    resource.data = { circles: [{ id: "one", name: "Nhóm thân quen", memberCount: 2, status: "active", myRole: "owner" }] };
    const html = renderToStaticMarkup(<CirclesView onOpen={() => {}} onNotice={() => {}}/>);
    expect(html).toContain("Nhóm thân quen");
    expect(html).toContain("2/8 người");
    expect(html).toContain("Tạo Circle");
  });

  it("shows Circle list loading and fetch failure with a retry", () => {
    resource.loading = true;
    expect(renderToStaticMarkup(<CirclesView onOpen={() => {}} onNotice={() => {}}/>)).toContain("Đang tìm nhóm của bạn");
    resource.loading = false;
    resource.error = "Không thể kết nối API.";
    const html = renderToStaticMarkup(<CirclesView onOpen={() => {}} onNotice={() => {}}/>);
    expect(html).toContain("Không thể kết nối API.");
    expect(html).toContain("Thử lại");
  });
});
