export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <a href="mailto:dmytrenko.gov.mil@gmail.com">© {year} Dmytrenko Anatoly</a>
    </footer>
  );
}
