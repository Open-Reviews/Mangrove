# Reviews server

## Common SQL operations

Select all orphaned reactions.
```
select * from public.reviews
where scheme='urn:maresi' and sub not in (select concat('urn:maresi:', signature) from public.reviews)
```
