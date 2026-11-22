do $$
declare
  updated_rows integer;
begin
  update public.marathon_temples
  set spoc = 'Shreesha Govind Dasa',
      email = 'srgd@hkmmumbai.org',
      phone = '9967800542'
  where name = 'HKM Mumbai'
    and city = 'Mumbai'
    and country = 'India';

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then
    raise exception 'Expected one HKM Mumbai directory entry, updated %', updated_rows;
  end if;
end;
$$;
