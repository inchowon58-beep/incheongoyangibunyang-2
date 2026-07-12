import FooterAdminLinks from "@/components/FooterAdminLinks";

const PLACE_URL =
  "https://map.naver.com/p/entry/place/1574598604?placePath=%2Fhome%3Fentry%3Dplt&searchType=place&lng=126.5721595&lat=33.2559783";

export default function FooterRe() {
  return (
    <footer className="re-footer">
      <div className="re-container re-footer-inner">
        <div>
          <p className="re-footer-brand">양준모공인중개사 태솔</p>
          <p className="re-footer-tag">2026 서귀포시 우수공인중개사</p>
        </div>
        <div className="re-footer-info">
          <p>대표 양준모</p>
          <p>제주특별자치도 서귀포시 동홍중앙로58-1, 1층</p>
          <p>Tel. 010-9049-4064</p>
          <p>사업자등록번호 665-11-02801</p>
          <p>등록번호 제50130-2024-00012호</p>
          <p>
            <a href={PLACE_URL} target="_blank" rel="noopener noreferrer">
              네이버 플레이스
            </a>
          </p>
        </div>
      </div>
      <div className="re-footer-copy re-footer-copy-row">
        <span>
          © {new Date().getFullYear()} 양준모공인중개사사무소 태솔. All rights
          reserved.
        </span>
        <FooterAdminLinks />
      </div>
    </footer>
  );
}
